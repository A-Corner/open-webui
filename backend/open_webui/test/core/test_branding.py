import unittest
from unittest.mock import patch, mock_open, MagicMock
import json
import os

# Assuming 'open_webui.core.branding' is the module to test
from open_webui.core.branding import load_branding_config, DEFAULT_BRANDING_CONFIG
from open_webui.env import DATA_DIR # To mock its value if needed, though direct use is fine if it's set for tests

# If 'log' is used in load_branding_config and needs mocking (e.g. to check calls)
# from open_webui.env import log as branding_log # Assuming log is imported as 'log' in branding.py

class TestBrandingConfig(unittest.TestCase):

    @patch('os.path.exists')
    @patch('builtins.open', new_callable=mock_open)
    @patch('open_webui.core.branding.log') # Mocking the logger used in branding.py
    def test_load_branding_config_file_not_found(self, mock_log, mock_file_open, mock_path_exists):
        mock_path_exists.return_value = False

        config = load_branding_config()

        self.assertEqual(config, DEFAULT_BRANDING_CONFIG)
        mock_log.info.assert_any_call(f"Branding configuration file not found at {os.path.join(DATA_DIR, 'branding_config.json')}. Using default branding.")

    @patch('os.path.exists')
    @patch('builtins.open', new_callable=mock_open)
    @patch('open_webui.core.branding.log')
    def test_load_branding_config_invalid_json(self, mock_log, mock_file_open, mock_path_exists):
        mock_path_exists.return_value = True
        mock_file_open.return_value.read.return_value = "this is not json"

        # Make json.load raise JSONDecodeError
        with patch('json.load', side_effect=json.JSONDecodeError("Error", "doc", 0)):
            config = load_branding_config()

        self.assertEqual(config, DEFAULT_BRANDING_CONFIG)
        mock_log.error.assert_any_call(f"Error decoding JSON from {os.path.join(DATA_DIR, 'branding_config.json')}: Error. Using default branding.")

    @patch('os.path.exists')
    @patch('builtins.open', new_callable=mock_open)
    @patch('open_webui.core.branding.log')
    def test_load_branding_config_empty_json(self, mock_log, mock_file_open, mock_path_exists):
        mock_path_exists.return_value = True
        mock_file_open.return_value.read.return_value = "{}" # Empty JSON

        # Simulate json.load returning an empty dict
        with patch('json.load', return_value={}):
            config = load_branding_config()

        # It should merge with defaults, so it should be equal to defaults if custom is empty
        self.assertEqual(config, DEFAULT_BRANDING_CONFIG)
        mock_log.info.assert_any_call(f"Successfully loaded branding configuration from {os.path.join(DATA_DIR, 'branding_config.json')}")

    @patch('os.path.exists')
    @patch('builtins.open', new_callable=mock_open)
    @patch('open_webui.core.branding.log')
    def test_load_branding_config_partial_custom_config(self, mock_log, mock_file_open, mock_path_exists):
        mock_path_exists.return_value = True
        custom_data = {
            "app_name": "My Custom App",
            "login_slogan": "Welcome Aboard!",
            "ui_theme": {
                "primary_color": "#123456"
            },
            "meta_tags": {
                "description": "Custom description here."
            }
        }
        mock_file_open.return_value.read.return_value = json.dumps(custom_data)

        with patch('json.load', return_value=custom_data):
            config = load_branding_config()

        self.assertEqual(config['app_name'], "My Custom App")
        self.assertEqual(config['login_slogan'], "Welcome Aboard!")
        # Check a default value that wasn't overridden
        self.assertEqual(config['footer_text'], DEFAULT_BRANDING_CONFIG['footer_text'])
        # Check merged theme (primary_color custom, others default)
        self.assertEqual(config['ui_theme']['primary_color'], "#123456")
        self.assertEqual(config['ui_theme']['secondary_color'], DEFAULT_BRANDING_CONFIG['ui_theme']['secondary_color'])
        # Check merged meta_tags
        self.assertEqual(config['meta_tags']['description'], "Custom description here.")
        self.assertEqual(config['meta_tags']['keywords'], DEFAULT_BRANDING_CONFIG['meta_tags']['keywords'])
        mock_log.info.assert_any_call(f"Successfully loaded branding configuration from {os.path.join(DATA_DIR, 'branding_config.json')}")

    @patch('os.path.exists')
    @patch('builtins.open', new_callable=mock_open)
    @patch('open_webui.core.branding.log')
    def test_load_branding_config_type_validation(self, mock_log, mock_file_open, mock_path_exists):
        mock_path_exists.return_value = True
        custom_data = {
            "enable_update_check": "not-a-boolean", # Invalid type
            "custom_links": {"text": "link", "url": "/"} # Invalid type, should be list
        }
        # Simulate json.load returning this data
        with patch('json.load', return_value=custom_data):
            config = load_branding_config()

        # Check that invalid types were reset to default and warnings logged
        self.assertEqual(config['enable_update_check'], DEFAULT_BRANDING_CONFIG['enable_update_check'])
        mock_log.warning.assert_any_call("Invalid type for 'enable_update_check' in branding_config.json, defaulting to True.")

        self.assertEqual(config['custom_links'], DEFAULT_BRANDING_CONFIG['custom_links'])
        mock_log.warning.assert_any_call("Invalid type for 'custom_links' in branding_config.json, defaulting to empty list.")

if __name__ == '__main__':
    unittest.main()
