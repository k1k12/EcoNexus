# Usage Instructions for `getcouncils.py`

The `getcouncils.py` script is designed to retrieve council data from the lginform api and store it in the database for use in the application.

## DISCLAIMER
**I have a local copy of the data saved in case I run out of data on this API. It's possible we hit the limit by the end of the project, in which case, someone else can make an account, or I can distribute the local version.**

## Prerequisites
- Ensure you have ran make install as outlined in the backend README.md

## Running the Script
- open the terminal and make sure you are in your venv
- navigate to backend directory
- run: `python src/api/scripts/getcouncils.py [options]`

## Options
- `-v/--verbose` - prints information about what is happening while running

## Example
To run the script and save the output to `data/councils.json`:
```bash
python src/api/scripts/getcouncils.py --verbose
```

## Notes
- Ensure the script has access to any required APIs or data sources.
- Check the logs for any errors or warnings during execution.

For further details, refer to the project documentation.