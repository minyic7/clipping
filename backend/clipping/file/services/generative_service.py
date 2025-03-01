import json
import os
import yaml
import base64
from abc import ABC, abstractmethod
from openai import OpenAI
from django.conf import settings


# Load the prompt keys from YAML into a dictionary at the beginning
def load_prompt_keys_from_yaml(file_path: str) -> dict:
    """Load predefined prompts from a YAML configuration file."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Config file {file_path} not found.")

    with open(file_path, "r", encoding="utf-8") as file:
        config = yaml.safe_load(file)

    # Validate the config structure
    for key, value in config.items():
        if "return_type" not in value:
            raise ValueError(f"Missing 'return_type' for key '{key}' in prompt config.")

    return config


# Load the prompt keys into a global dictionary
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))  # Get the directory of the script
PROMPT_KEYS_PATH = os.path.join(SCRIPT_DIR, "prompt_key.yaml")  # Construct the full path to 'prompt_key.yaml'

# Load the prompt keys from the YAML file
PROMPT_KEYS = load_prompt_keys_from_yaml(PROMPT_KEYS_PATH)


class GenerativeService(ABC):
    """
    Abstract base class to define the interface for generative models.
    """

    def __init__(self, api_key: str, prompt_keys: dict):
        self.client = OpenAI(api_key=api_key)
        self.prompt_keys = prompt_keys  # Prompt keys are supplied as a dictionary

    @abstractmethod
    def generate(self, prompt_key: str = None, custom_prompt: str = None, return_format: str = "text",
                 media_object: str = None):
        """Abstract method to handle different types of generations."""
        pass


class GPTService(GenerativeService):
    """
    Implementation of GenerativeService for GPT-based models using the OpenAI API.
    """

    def __init__(self, api_key: str = None, prompt_keys: dict = PROMPT_KEYS):
        api_key = api_key or settings.GPT_API_KEY or os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("GPT API Key is missing.")
        super().__init__(api_key=api_key, prompt_keys=prompt_keys)

    def generate(self, prompt_key: str = None, custom_prompt: str = None, return_format: str = "text",
                 media_object: str = None):
        """
        Generates output based on the given prompt key, return format, and optional media object.
        """
        if prompt_key:
            if prompt_key not in self.prompt_keys:
                return {"error": "Invalid prompt key."}
            prompt_data = self.prompt_keys[prompt_key]
            prompt = prompt_data["prompt"]
            return_type = prompt_data["return_type"]
        elif custom_prompt:
            prompt = custom_prompt
            return_type = "string"  # Default expected return type
        else:
            return {"error": "Either a prompt key or a custom prompt must be provided."}

        media_input = None
        if media_object:
            media_input = self._prepare_media(media_object)

        response = self._generate_response(prompt, return_format, media_input)

        # Validate response format
        if return_type == "list":
            try:
                if 'error' in response:
                    return {'error': response['error']}
                parsed_response = json.loads(response["content"])  # Try parsing as a JSON list
                if not isinstance(parsed_response, list):
                    return {"error": "Response is not a valid list format."}
            except json.JSONDecodeError:
                return {"error": "Response is not valid JSON or is improperly formatted."}

        return response

    def _generate_response(self, prompt: str, return_format: str, media_input: dict = None):
        """Handles response generation, supporting both text and vision models."""
        try:
            messages = [{"role": "user", "content": [{"type": "text", "text": prompt}]}]

            if media_input:
                messages[0]["content"].append(media_input)

            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=messages
            )
            return {"type": "text", "content": response.choices[0].message.content}
        except Exception as e:
            return {"error": f"Generation failed: {str(e)}"}

    @staticmethod
    def _prepare_media(media_object: str) -> dict:
        """Processes media input (URL or local file) for OpenAI API."""
        try:
            if media_object.startswith("http"):
                return {"type": "image_url", "image_url": {"url": media_object}}
            else:
                with open(media_object, "rb") as f:
                    encoded_str = base64.b64encode(f.read()).decode("utf-8")
                return {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{encoded_str}"}}
        except Exception as e:
            raise ValueError(f"Error processing media: {str(e)}")