import unittest
from unittest.mock import patch, mock_open, MagicMock
import yaml
import os
import logging
import copy # For deepcopying DEFAULT_SETTINGS

# Import the functions and defaults to be tested
from open_webui.core.settings_loader import load_settings_config, deep_merge_dicts, DEFAULT_SETTINGS
from open_webui.env import DATA_DIR # Actual DATA_DIR for path construction in tests

# Temporarily disable logging for cleaner test output, or mock it to check calls
# logging.disable(logging.CRITICAL)

# Define a mirror of DEFAULT_SETTINGS for comparison, to ensure tests don't modify the original
# This also helps if the original DEFAULT_SETTINGS in settings_loader.py gets complex default values
# that are computed at module load time (e.g. os.path.join(DATA_DIR,...))
# For this test, we want to ensure our DEFAULT_SETTINGS_FOR_TEST is based on how it's defined in settings_loader
# The key is that paths like database.url and rag.vector_db.chroma_path in DEFAULT_SETTINGS
# are constructed using the *initial* value of open_webui.env.DATA_DIR.
# We'll use a deepcopy of the imported DEFAULT_SETTINGS from the module.
DEFAULT_SETTINGS_FOR_TEST = copy.deepcopy(DEFAULT_SETTINGS)


class TestDeepMergeDicts(unittest.TestCase):
    def test_deep_merge_simple(self):
        dest = {'a': 1, 'b': 2}
        src = {'b': 3, 'c': 4}
        expected = {'a': 1, 'b': 3, 'c': 4}
        self.assertEqual(deep_merge_dicts(src, dest), expected)

    def test_deep_merge_nested(self):
        dest = {'a': {'x': 1, 'y': 2}, 'b': 10}
        src = {'a': {'y': 3, 'z': 4}, 'c': 20}
        expected = {'a': {'x': 1, 'y': 3, 'z': 4}, 'b': 10, 'c': 20}
        self.assertEqual(deep_merge_dicts(src, dest), expected)

    def test_deep_merge_overwrite_values(self):
        dest = {'a': 1, 'b': {'x': 10}}
        src = {'a': 2, 'b': {'x': 20, 'y': 30}}
        expected = {'a': 2, 'b': {'x': 20, 'y': 30}}
        self.assertEqual(deep_merge_dicts(src, dest), expected)

    def test_deep_merge_add_new_keys_to_nested(self):
        dest = {'a': {'x': 1}}
        src = {'a': {'y': 2}}
        expected = {'a': {'x': 1, 'y': 2}}
        self.assertEqual(deep_merge_dicts(src, dest), expected)

    def test_deep_merge_source_empty(self):
        dest = {'a': 1}
        src = {}
        self.assertEqual(deep_merge_dicts(src, dest), dest)

    def test_deep_merge_destination_empty(self):
        dest = {}
        src = {'a': 1}
        self.assertEqual(deep_merge_dicts(src, dest), src)

    def test_deep_merge_non_dict_in_dest(self):
        dest = {'a': 1, 'b': 'not a dict'}
        src = {'b': {'x': 10}}
        expected = {'a': 1, 'b': {'x': 10}} # Source dict overwrites non-dict
        self.assertEqual(deep_merge_dicts(src, dest), expected)


class TestSettingsLoader(unittest.TestCase):

    def setUp(self):
        # Make a fresh copy for each test to avoid side effects if defaults are modified
        self.default_settings = copy.deepcopy(DEFAULT_SETTINGS_FOR_TEST)
        # Mock the project root for consistent relative path resolution
        self.mock_project_root = "/test_project_root"
        # Mock DATA_DIR from env, as it's used by settings_loader to form default paths
        self.mock_data_dir = os.path.join(self.mock_project_root, "data_from_env")

    @patch('open_webui.core.settings_loader.log')
    @patch('os.path.exists')
    def test_no_config_file_found(self, mock_exists, mock_log):
        mock_exists.return_value = False
        with patch('open_webui.env.DATA_DIR', self.mock_data_dir): # Ensure consistent DATA_DIR for path check
             with patch('open_webui.core.settings_loader.os.path.dirname', return_value=os.path.join(self.mock_project_root, "backend/open_webui/core")):
                config = load_settings_config()

        self.assertEqual(config["service"]["host"], self.default_settings["service"]["host"]) # Check a few key defaults
        self.assertEqual(config["frontend_branding"]["app_name"], self.default_settings["frontend_branding"]["app_name"])
        # Verify log message (the exact path might vary based on how project_root is determined in the actual code)
        mock_log.info.assert_any_call("No settings_config.yaml found in potential paths. Using default settings.")

    @patch('open_webui.core.settings_loader.log')
    @patch('builtins.open', new_callable=mock_open, read_data="")
    @patch('os.path.exists')
    def test_empty_yaml_file(self, mock_exists, mock_file_open, mock_log):
        mock_exists.return_value = True # File exists
        # yaml.safe_load("") returns None
        with patch('yaml.safe_load', return_value=None):
            with patch('open_webui.env.DATA_DIR', self.mock_data_dir):
                with patch('open_webui.core.settings_loader.os.path.dirname', return_value=os.path.join(self.mock_project_root, "backend/open_webui/core")):
                    config = load_settings_config("dummy_path.yaml") # Path provided, so exists is for this

        self.assertEqual(config["service"]["port"], self.default_settings["service"]["port"])
        mock_log.info.assert_any_call("Settings file dummy_path.yaml is empty. Using default settings.")

    @patch('open_webui.core.settings_loader.log')
    @patch('builtins.open', new_callable=mock_open, read_data="key: value: \n  no_indent")
    @patch('os.path.exists')
    def test_invalid_yaml_file(self, mock_exists, mock_file_open, mock_log):
        mock_exists.return_value = True
        with patch('yaml.safe_load', side_effect=yaml.YAMLError("yaml parse error")):
            with patch('open_webui.env.DATA_DIR', self.mock_data_dir):
                with patch('open_webui.core.settings_loader.os.path.dirname', return_value=os.path.join(self.mock_project_root, "backend/open_webui/core")):
                    config = load_settings_config("dummy_path.yaml")

        self.assertEqual(config["service"]["host"], self.default_settings["service"]["host"])
        mock_log.error.assert_any_call("Error parsing YAML from dummy_path.yaml: yaml parse error. Using default settings.")

    @patch('open_webui.core.settings_loader.log')
    @patch('builtins.open', new_callable=mock_open)
    @patch('os.path.exists')
    def test_partial_valid_yaml_config(self, mock_exists, mock_file_open, mock_log):
        mock_exists.return_value = True
        partial_user_config = {
            "service": {"port": 8088},
            "frontend_branding": {"app_title": "My Custom WebUI"},
            "rag": {"embedding": {"model": "custom/embedding-model"}}
        }
        mock_file_open.return_value.read.return_value = yaml.dump(partial_user_config)

        with patch('yaml.safe_load', return_value=partial_user_config):
            with patch('open_webui.env.DATA_DIR', self.mock_data_dir):
                with patch('open_webui.core.settings_loader.os.path.dirname', return_value=os.path.join(self.mock_project_root, "backend/open_webui/core")):
                    config = load_settings_config("dummy_path.yaml")

        expected_config = copy.deepcopy(self.default_settings)
        expected_config["service"]["port"] = 8088
        expected_config["frontend_branding"]["app_title"] = "My Custom WebUI"
        expected_config["rag"]["embedding"]["model"] = "custom/embedding-model"

        self.assertEqual(config["service"]["port"], 8088)
        self.assertEqual(config["frontend_branding"]["app_title"], "My Custom WebUI")
        self.assertEqual(config["rag"]["embedding"]["model"], "custom/embedding-model")
        self.assertEqual(config["service"]["host"], self.default_settings["service"]["host"]) # Unchanged
        self.assertEqual(config["rag"]["text_processing"]["chunk_size"], self.default_settings["rag"]["text_processing"]["chunk_size"]) # Unchanged nested
        mock_log.info.assert_any_call("Successfully loaded and merged settings from dummy_path.yaml")


    @patch('open_webui.core.settings_loader.log')
    @patch('os.path.abspath')
    @patch('builtins.open', new_callable=mock_open)
    @patch('os.path.exists')
    def test_data_dir_resolution_from_yaml(self, mock_exists, mock_file_open, mock_abspath, mock_log):
        mock_exists.return_value = True

        # Test 1: Absolute path in YAML
        user_config_abs = {"service": {"data_dir": "/custom/data/path"}}
        mock_file_open.return_value.read.return_value = yaml.dump(user_config_abs)
        mock_abspath.side_effect = lambda x: x # mock abspath to return input if already abs

        with patch('yaml.safe_load', return_value=user_config_abs):
            with patch('open_webui.env.DATA_DIR', self.mock_data_dir): # This DATA_DIR is for finding settings.yaml
                 with patch('open_webui.core.settings_loader.os.path.dirname', return_value=os.path.join(self.mock_project_root, "backend/open_webui/core")):
                    config = load_settings_config("dummy_path.yaml")
        self.assertEqual(config['service']['data_dir'], "/custom/data/path")

        # Test 2: Relative path in YAML (should be relative to project root)
        user_config_rel = {"service": {"data_dir": "./mydata"}}
        mock_file_open.return_value.read.return_value = yaml.dump(user_config_rel)
        # mock_abspath to simulate making it absolute from project_root
        mock_abspath.side_effect = lambda x: os.path.join(self.mock_project_root, x.replace("./", "")) if x.startswith("./") else x

        with patch('yaml.safe_load', return_value=user_config_rel):
            with patch('open_webui.env.DATA_DIR', self.mock_data_dir):
                with patch('open_webui.core.settings_loader.os.path.dirname', return_value=os.path.join(self.mock_project_root, "backend/open_webui/core")): # This sets where settings_loader thinks it is
                    config = load_settings_config("dummy_path.yaml")
        self.assertEqual(config['service']['data_dir'], os.path.join(self.mock_project_root, "mydata"))


    @patch('open_webui.core.settings_loader.log')
    @patch('os.path.exists')
    def test_secret_key_warning(self, mock_exists, mock_log):
        # Scenario 1: No YAML file, default secret key used
        mock_exists.return_value = False
        with patch('open_webui.env.DATA_DIR', self.mock_data_dir):
            with patch('open_webui.core.settings_loader.os.path.dirname', return_value=os.path.join(self.mock_project_root, "backend/open_webui/core")):
                config_no_file = load_settings_config()
        self.assertEqual(config_no_file['service']['secret_key'], "YOUR_SECRET_KEY_HERE_CHANGE_ME")
        mock_log.warning.assert_any_call("CRITICAL: Default 'service.secret_key' is in use. Please change it in your settings_config.yaml for security.")
        mock_log.reset_mock()

        # Scenario 2: YAML file exists but service.secret_key uses the default placeholder
        mock_exists.return_value = True
        user_config_default_key = {"service": {"secret_key": "YOUR_SECRET_KEY_HERE_CHANGE_ME"}}
        m = mock_open(read_data=yaml.dump(user_config_default_key))
        with patch('builtins.open', m):
            with patch('yaml.safe_load', return_value=user_config_default_key):
                with patch('open_webui.env.DATA_DIR', self.mock_data_dir):
                    with patch('open_webui.core.settings_loader.os.path.dirname', return_value=os.path.join(self.mock_project_root, "backend/open_webui/core")):
                        config_default_key = load_settings_config("dummy_path.yaml")
        self.assertEqual(config_default_key['service']['secret_key'], "YOUR_SECRET_KEY_HERE_CHANGE_ME")
        mock_log.warning.assert_any_call("CRITICAL: Default 'service.secret_key' is in use. Please change it in your settings_config.yaml for security.")
        mock_log.reset_mock()

        # Scenario 3: YAML file exists and service.secret_key is custom
        user_config_custom_key = {"service": {"secret_key": "my_very_secure_custom_key"}}
        m = mock_open(read_data=yaml.dump(user_config_custom_key))
        with patch('builtins.open', m):
            with patch('yaml.safe_load', return_value=user_config_custom_key):
                with patch('open_webui.env.DATA_DIR', self.mock_data_dir):
                     with patch('open_webui.core.settings_loader.os.path.dirname', return_value=os.path.join(self.mock_project_root, "backend/open_webui/core")):
                        config_custom_key = load_settings_config("dummy_path.yaml")
        self.assertEqual(config_custom_key['service']['secret_key'], "my_very_secure_custom_key")
        # Check that the specific warning was NOT called
        for call_args in mock_log.warning.call_args_list:
            self.assertNotIn("CRITICAL: Default 'service.secret_key' is in use.", call_args[0][0])


    @patch('open_webui.core.settings_loader.log')
    @patch('os.path.exists')
    def test_config_path_override_and_search_order(self, mock_exists, mock_log):
        # Path evaluation order: override > root > DATA_DIR

        override_path = "specific/path/to/my_settings.yaml"
        root_path = os.path.join(self.mock_project_root, "settings_config.yaml")
        data_dir_path = os.path.join(self.mock_data_dir, "settings_config.yaml")

        # Scenario 1: Override path exists
        mock_exists.side_effect = lambda path: path == override_path
        with patch('builtins.open', mock_open(read_data=yaml.dump({"service": {"port": 1111}}))):
            with patch('yaml.safe_load', return_value={"service": {"port": 1111}}):
                with patch('open_webui.env.DATA_DIR', self.mock_data_dir):
                    with patch('open_webui.core.settings_loader.os.path.dirname', return_value=os.path.join(self.mock_project_root, "backend/open_webui/core")):
                        config = load_settings_config(config_file_path_override=override_path)
        mock_log.info.assert_any_call(f"Using settings configuration file: {override_path}")
        self.assertEqual(config["service"]["port"], 1111)
        mock_exists.assert_any_call(override_path) # Should only check this one due to short-circuit

        # Scenario 2: Override not found, root path exists
        mock_exists.side_effect = lambda path: path == root_path
        with patch('builtins.open', mock_open(read_data=yaml.dump({"service": {"port": 2222}}))):
            with patch('yaml.safe_load', return_value={"service": {"port": 2222}}):
                with patch('open_webui.env.DATA_DIR', self.mock_data_dir):
                    with patch('open_webui.core.settings_loader.os.path.dirname', return_value=os.path.join(self.mock_project_root, "backend/open_webui/core")):
                        config = load_settings_config(config_file_path_override="non_existent_override.yaml")
        mock_log.info.assert_any_call(f"Using settings configuration file: {root_path}")
        self.assertEqual(config["service"]["port"], 2222)
        mock_exists.assert_any_call("non_existent_override.yaml")
        mock_exists.assert_any_call(root_path)


        # Scenario 3: Override and root not found, DATA_DIR path exists
        mock_exists.side_effect = lambda path: path == data_dir_path
        with patch('builtins.open', mock_open(read_data=yaml.dump({"service": {"port": 3333}}))):
            with patch('yaml.safe_load', return_value={"service": {"port": 3333}}):
                with patch('open_webui.env.DATA_DIR', self.mock_data_dir): # Ensure DATA_DIR is what we expect
                    with patch('open_webui.core.settings_loader.os.path.dirname', return_value=os.path.join(self.mock_project_root, "backend/open_webui/core")):
                        config = load_settings_config(config_file_path_override="non_existent_override.yaml")
        mock_log.info.assert_any_call(f"Using settings configuration file: {data_dir_path}")
        self.assertEqual(config["service"]["port"], 3333)
        mock_exists.assert_any_call("non_existent_override.yaml")
        mock_exists.assert_any_call(root_path)
        mock_exists.assert_any_call(data_dir_path)


if __name__ == '__main__':
    unittest.main()
