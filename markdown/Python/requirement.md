# Using pipreqs (Only Includes Imported Packages)
- `pip install pipreqs`
- `pipreqs . --savepath requirements.txt`

```sh
pip install uvicorn
pip freeze | grep uvicorn >> requirements.txt
```
# Check Environment Variable in Terminal
`echo $VIRTUAL_ENV`

# Check Python Path
`which python`
`python -c "import sys; print(sys.executable)"`
