#!/usr/bin/env bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
cd "$SCRIPT_DIR" || exit

# Add conditional Playwright browser installation
if [[ "${WEB_LOADER_ENGINE,,}" == "playwright" ]]; then
    if [[ -z "${PLAYWRIGHT_WS_URL}" ]]; then
        echo "Installing Playwright browsers..."
        playwright install chromium
        playwright install-deps chromium
    fi

    python -c "import nltk; nltk.download('punkt_tab')"
fi

KEY_FILE=.webui_secret_key

# Default values
DEFAULT_HOST="0.0.0.0"
DEFAULT_PORT="8080"
DEFAULT_WORKERS="1"

# Attempt to read from settings_config.yaml if yq is available
CONFIG_HOST=""
CONFIG_PORT=""
CONFIG_WORKERS=""

# Determine potential config file paths
# Path relative to SCRIPT_DIR (i.e., backend directory) leading to project root
PROJECT_ROOT_CONFIG_PATH="$SCRIPT_DIR/../settings_config.yaml"
# Path within DATA_DIR (DATA_DIR needs to be defined or defaulted for this)
# Assuming DATA_DIR might be set as an env var, or use a common default like './data' relative to SCRIPT_DIR/..
DATA_DIR_PATH="${DATA_DIR:-$SCRIPT_DIR/../data}/settings_config.yaml"

CONFIG_FILE_TO_USE=""

if [ -f "$PROJECT_ROOT_CONFIG_PATH" ]; then
  CONFIG_FILE_TO_USE="$PROJECT_ROOT_CONFIG_PATH"
elif [ -f "$DATA_DIR_PATH" ]; then
  CONFIG_FILE_TO_USE="$DATA_DIR_PATH"
fi

if [ -n "$CONFIG_FILE_TO_USE" ] && command -v yq &> /dev/null; then
  echo "Attempting to read service configuration from $CONFIG_FILE_TO_USE using yq."
  CONFIG_HOST=$(yq e '.service.host' "$CONFIG_FILE_TO_USE" 2>/dev/null)
  CONFIG_PORT=$(yq e '.service.port' "$CONFIG_FILE_TO_USE" 2>/dev/null)
  CONFIG_WORKERS=$(yq e '.service.workers' "$CONFIG_FILE_TO_USE" 2>/dev/null)

  # yq returns 'null' as a string if key is not found or file is invalid yaml for path
  [ "$CONFIG_HOST" = "null" ] && CONFIG_HOST=""
  [ "$CONFIG_PORT" = "null" ] && CONFIG_PORT=""
  [ "$CONFIG_WORKERS" = "null" ] && CONFIG_WORKERS=""

  echo "Values from YAML: HOST='${CONFIG_HOST}', PORT='${CONFIG_PORT}', WORKERS='${CONFIG_WORKERS}'"
else
  if [ -z "$CONFIG_FILE_TO_USE" ]; then
    echo "settings_config.yaml not found in default locations."
  else
    echo "yq command not found. Cannot parse settings_config.yaml."
  fi
  echo "Falling back to environment variables or script defaults for host, port, and workers."
fi

# Precedence: ENV_VAR > YAML_CONFIG > DEFAULT_VALUE
HOST="${HOST:-${CONFIG_HOST:-$DEFAULT_HOST}}"
PORT="${PORT:-${CONFIG_PORT:-$DEFAULT_PORT}}"
UVICORN_WORKERS_VALUE="${WEBUI_WORKERS:-${CONFIG_WORKERS:-$DEFAULT_WORKERS}}"

echo "Final effective settings for Uvicorn: HOST='${HOST}', PORT='${PORT}', WORKERS='${UVICORN_WORKERS_VALUE}'"

if test "$WEBUI_SECRET_KEY $WEBUI_JWT_SECRET_KEY" = " "; then
  echo "Loading WEBUI_SECRET_KEY from file, not provided as an environment variable."

  if ! [ -e "$KEY_FILE" ]; then
    echo "Generating WEBUI_SECRET_KEY"
    # Generate a random value to use as a WEBUI_SECRET_KEY in case the user didn't provide one.
    echo $(head -c 12 /dev/random | base64) > "$KEY_FILE"
  fi

  echo "Loading WEBUI_SECRET_KEY from $KEY_FILE"
  WEBUI_SECRET_KEY=$(cat "$KEY_FILE")
fi

if [[ "${USE_OLLAMA_DOCKER,,}" == "true" ]]; then
    echo "USE_OLLAMA is set to true, starting ollama serve."
    ollama serve &
fi

if [[ "${USE_CUDA_DOCKER,,}" == "true" ]]; then
  echo "CUDA is enabled, appending LD_LIBRARY_PATH to include torch/cudnn & cublas libraries."
  export LD_LIBRARY_PATH="$LD_LIBRARY_PATH:/usr/local/lib/python3.11/site-packages/torch/lib:/usr/local/lib/python3.11/site-packages/nvidia/cudnn/lib"
fi

# Check if SPACE_ID is set, if so, configure for space
if [ -n "$SPACE_ID" ]; then
  echo "Configuring for HuggingFace Space deployment"
  if [ -n "$ADMIN_USER_EMAIL" ] && [ -n "$ADMIN_USER_PASSWORD" ]; then
    echo "Admin user configured, creating"
    WEBUI_SECRET_KEY="$WEBUI_SECRET_KEY" uvicorn open_webui.main:app --host "$HOST" --port "$PORT" --forwarded-allow-ips '*' &
    webui_pid=$!
    echo "Waiting for webui to start..."
    while ! curl -s http://localhost:8080/health > /dev/null; do
      sleep 1
    done
    echo "Creating admin user..."
    curl \
      -X POST "http://localhost:8080/api/v1/auths/signup" \
      -H "accept: application/json" \
      -H "Content-Type: application/json" \
      -d "{ \"email\": \"${ADMIN_USER_EMAIL}\", \"password\": \"${ADMIN_USER_PASSWORD}\", \"name\": \"Admin\" }"
    echo "Shutting down webui..."
    kill $webui_pid
  fi

  export WEBUI_URL=${SPACE_HOST}
fi

WEBUI_SECRET_KEY="$WEBUI_SECRET_KEY" exec uvicorn open_webui.main:app --host "$HOST" --port "$PORT" --forwarded-allow-ips '*' --workers "${UVICORN_WORKERS_VALUE}"
