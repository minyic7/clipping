# Clipping Backend
Backend for my clipping project, which is a one page web application for sharing media content.

## Structure
```plaintext
.
├── README.md
├── environment.yaml
├── data
│   ├── raw
│   ├── processed
├── notebooks
│   ├── analysis.ipynb
├── src
│   ├── app.py
│   ├── utils.py
└── tests
    ├── test_app.py
```
- **data/**: Folder containing raw and processed data.
  - **raw/**: Raw data files.
  - **processed/**: Processed data files.
- **notebooks/**: Jupyter notebooks for data analysis and experiments.
- **src/**: Source code for the project.
  - **app.py**: Main application file.
  - **utils.py**: Utility functions.
- **tests/**: Unit tests for the project.
  - **test_app.py**: Tests for the main application.

## Setup

### Create and Activate the Conda Environment
```shell
conda env create -f environment.yaml
conda activate clipping
```

#### Setup R2 Credential
```shell
conda env config vars set TOKEN_VALUE='g_atoAsPwZqk1imAanUbAiq1yQPWmL'
conda env config vars set ACCESS_KEY_ID='a05a60f68c70c23977f17b0c758c2d1d'
conda env config vars set SECRET_ACCESS_KEY='0261da4f6480d2f2f332e39aef35066687e5c521ecdff373e6cdcee62983bd0a'

conda deactivate
conda activate clipping
```

To check use: `conda env config vars list`

### Run the Application
```shell
python -m src.app
```

## Usage
[Provide additional usage instructions or examples here]

## License
[Provide licensing information here]