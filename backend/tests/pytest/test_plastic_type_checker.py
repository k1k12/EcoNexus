import os
import json
import pytest
from app.json_wrapper.plastic_type_checker import PlasticTypeChecker

class TestPlasticTypeChecker:
    @pytest.fixture(autouse=True)
    def init_checker(self):
        # Compute path to src/app/json_wrapper/plastics.json
        # Adjust the two os.path.dirname calls if your tests live deeper.
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
        package_path = os.path.join(project_root, 'src', 'app', 'json_wrapper')
        json_file_name = 'plastics.json'

        # The JSON is expected to have a top-level "plastics" key
        with open(package_path + "/" +json_file_name, "r", encoding="utf-8") as f:
            data = json.load(f)
        assert 'plastics' in data, "missing 'plastics' key"
        self.original_dict = data['plastics']
        # Initialize checker with the full JSON (it should pick out data['plastics'] internally)
        self.checker = PlasticTypeChecker("app.json_wrapper", json_file_name)
        yield
        # no teardown needed

    def test_get_dictionary(self):
        """ get_dictionary() returns exactly the 'plastics' mapping from the JSON. """
        assert self.checker.get_dictionary() == self.original_dict

    @pytest.mark.parametrize("input_,expected", [
        ("PET", "PET"),
        ("PETE", "PET"),
        ("polyethylene terephthalate", "PET"),
        ("HDPE 2", "HDPE"),
        ("HDPEE", "HDPE"),
    ])
    def test_check_type_valid_variations(self, input_, expected):
        """ Valid names and synonyms all map back to the canonical code. """
        assert self.checker.check_type(input_) == expected

    def test_check_type_invalid(self):
        """ Anything unrecognized returns None. """
        assert self.checker.check_type("NotARealPlastic") is None

    def test_set_dictionary(self):
        """ You can replace the dictionary wholesale and get it back. """
        new_dict = {
            "XYZ": {
                "variations": ["x y z", "xyz"],
                "full_name": "Some New Plastic"
            }
        }
        # set_dictionary should now swap in our new mapping
        self.checker.set_dictionary(new_dict)
        assert self.checker.get_dictionary() == new_dict

        # and you can restore the original
        self.checker.set_dictionary(self.original_dict)
        assert self.checker.get_dictionary() == self.original_dict
