import json
import time
from importlib import resources
from rapidfuzz import fuzz as fuzz


class PlasticTypeChecker:
    def __init__(self, package: str, filename: str):
        self.package = package
        self.filename = filename
        self.dictionary = {}
        self._last_loaded = 0
        self.load_dictionary()

    def load_dictionary(self):
        # Hot-reload: check mtime
        with resources.path(self.package, self.filename) as path:
            mtime = path.stat().st_mtime
            if mtime != self._last_loaded:
                with path.open("r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.dictionary = data.get("plastics", data)
                self._last_loaded = mtime

    def check_type(self, string: str):
        self.load_dictionary()

        current_plastic_type = None
        for key, values in self.dictionary.items():
            variations = values["variations"] + [values["full_name"], key]
            for variant in variations:
                score = fuzz.ratio(string, variant) / 100
                if score >= 0.7:
                    current_plastic_type = key
                    if score > 0.97:
                        return current_plastic_type
        return current_plastic_type

    def set_dictionary(self, dictionary):
        """
        Set the dictionary to use for checking plastic types.
        :param dictionary: The dictionary to use.
        """
        self.dictionary = dictionary['plastics'] if 'plastics' in dictionary else dictionary

    def get_dictionary(self):
        """
        Get the dictionary used for checking plastic types.
        :return: The dictionary used for checking plastic types.
        """
        return self.dictionary
        