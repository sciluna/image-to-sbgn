# image-to-sbgn

Convert hand-drawn SBGN (Systems Biology Graphical Notation) maps to digital SBGNML format using AI-powered image analysis.

[![Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://dev.sciluna.com/image2sbgn/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 🌟 Overview

**image-to-sbgn** is a web-based tool that leverages Large Language Models (LLMs) to automatically convert hand-drawn biological network diagrams into machine-readable SBGNML files. This tool bridges the gap between sketching biological pathways on paper and creating formal, standardized digital representations.

### Key Features

- **AI-Powered Conversion**: Uses state-of-the-art vision language models (GPT-4, Gemini, Bedrock) to analyze hand-drawn diagrams
- **SBGN Standard Support**: Supports both Process Description (PD) and Activity Flow (AF) languages
- **Interactive Editor**: Built-in Cytoscape.js-based editor for viewing and refining converted networks
- **Biological Entity Grounding**: Integration with INDRA for automatic annotation of biological entities
- **Export Options**: Export to SBGNML format for use in other SBGN tools
- **Multiple Model Providers**: Choose from OpenAI, Google Gemini, AWS Bedrock, or OpenAI-compatible APIs
- **Real-time Visualization**: Immediate visual feedback of the converted network

## 🚀 Demo

Try the live demo: [https://dev.sciluna.com/image2sbgn/](https://dev.sciluna.com/image2sbgn/)

## 📋 Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Development](#development)
- [Docker Deployment](#docker-deployment)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## 🛠️ Installation

### Prerequisites

- Node.js (v20.14.0 or higher)
- npm or yarn package manager

### Setup

1. Clone the repository:
```bash
git clone https://github.com/sciluna/image-to-sbgn.git
cd image-to-sbgn
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:

Create a `.env` file in the root directory with the following variables:

```env
PORT=4000
NODE_ENV=development

# API Keys (configure based on your chosen provider)
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
```

4. Build the client bundle:
```bash
npm run build
```

5. Start the application:

For development:
```bash
npm run dev
```

For production:
```bash
npm start
```

The application will be available at `http://localhost:4000`

## 📖 Usage

### Web Interface

1. **Upload or Select a Sample**: 
   - Upload your hand-drawn SBGN diagram (PNG format recommended)
   - Or select one of the provided sample diagrams

2. **Choose SBGN Language**:
   - Process Description (PD): For molecular interaction maps
   - Activity Flow (AF): For high-level regulatory networks

3. **Select AI Model Provider**:
   - OpenAI (GPT-4)
   - Google Gemini
   - AWS Bedrock
   - OpenAI-compatible APIs

4. **Add Optional Comments**: Provide additional context or instructions for the AI

5. **Generate**: Click the convert button to process your diagram

6. **Review and Edit**: 
   - View the converted network in the interactive editor
   - Make adjustments if needed
   - Ground biological entities using the annotation feature

7. **Export**: Download the SBGNML file for use in other tools

### Supported SBGN Elements

#### Process Description (PD)
- **Node Types**: Macromolecule, Simple Chemical, Complex, Nucleic Acid Feature, Perturbing Agent, Unspecified Entity, Compartment, Submap, Empty Set, Phenotype, Process, Omitted Process, Uncertain Process, Association, Dissociation, AND, OR, NOT
- **Edge Types**: Consumption, Production, Modulation, Stimulation, Catalysis, Inhibition, Necessary Stimulation, Logic Arc

#### Activity Flow (AF)
- **Node Types**: Biological Activity, Phenotype, AND, OR, NOT, Delay
- **Edge Types**: Positive Influence, Negative Influence, Unknown Influence, Necessary Stimulation, Logic Arc

## 🔌 API Endpoints

### POST `/gpt`

Convert hand-drawn SBGN image to SBGNML format.

**Request Body:**
```json
{
  "image": "base64_encoded_image_or_url",
  "language": "PD",  // or "AF"
  "model": "openai",  // or "gemini", "bedrock", "openai-compatible"
  "comment": "Optional additional instructions"
}
```

**Response:**
```json
{
  "answer": "SBGNML content as string"
}
```

### POST `/anno`

Ground biological entities using INDRA service.

**Request Body:**
```json
[
  {
    "text": "Entity name"
  }
]
```

**Response:**
```json
[
  {
    "term": {
      "id": "database_id",
      "db": "database_name",
      "entry_name": "entity_name"
    }
  }
]
```

### POST `/upload`

Upload and save SBGNML file to server.

**Request Body:**
```json
{
  "filename": "diagram.sbgn",
  "content": "SBGNML content"
}
```

**Response:**
```json
{
  "url": "https://hostname/temp/diagram.sbgn",
  "filename": "diagram.sbgn"
}
```

### POST `/delete`

Delete uploaded file from server.

**Request Body:**
```json
{
  "filename": "diagram.sbgn"
}
```

## 🏗️ Technology Stack

### Backend
- **Node.js** with Express.js
- **Token.js**: Multi-provider LLM client library
- **OpenAI API**: Vision language model integration
- **CORS**: Cross-origin resource sharing

### Frontend
- **Cytoscape.js**: Network visualization
- **cytoscape-sbgn-stylesheet**: SBGN-specific styling
- **sbgnml-to-cytoscape**: SBGNML parser
- **libsbgn.js**: SBGN file manipulation
- **Fomantic UI**: User interface components
- **FileSaver.js**: Client-side file saving

### Build Tools
- **Webpack**: Module bundling
- **Babel**: JavaScript transpilation

## 📁 Project Structure

```
image-to-sbgn/
├── src/
│   ├── app.js              # Express server entry point
│   ├── index.js            # API routes and LLM integration
│   ├── prompts.js          # AI prompt templates
│   └── assets/             # Reference images and SBGNML examples
│       ├── sbgn_pd_stylesheet.png
│       ├── sbgn_af_stylesheet.png
│       ├── PD_reference*.png/.sbgn
│       └── AF_reference*.png/.sbgn
├── public/
│   ├── index.html          # Main web interface
│   ├── js/                 # Client-side JavaScript
│   ├── css/                # Stylesheets
│   ├── img/                # Images and icons
│   ├── examples/           # Sample hand-drawn diagrams
│   └── dist/               # Built bundles
├── package.json            # Dependencies and scripts
├── webpack.config.js       # Webpack configuration
├── .babelrc               # Babel configuration
├── Dockerfile             # Docker container definition
└── README.md              # This file
```

## 💻 Development

### Building the Project

```bash
npm run build
```

This uses Webpack to bundle the client-side code into `public/dist/bundle.js`.

### Running in Development Mode

```bash
npm run dev
```

This starts the server with `NODE_ENV=development` which affects base paths and logging.

### Code Structure

- **Frontend Logic** (`public/js/`): Handles user interactions, file uploads, network visualization
- **Backend API** (`src/index.js`): Processes requests, communicates with LLM APIs
- **Prompt Engineering** (`src/prompts.js`): Contains carefully crafted prompts for optimal AI performance
- **Reference Materials** (`src/assets/`): Example images and SBGNML files used in few-shot learning

## 🐳 Docker Deployment

Build and run using Docker:

```bash
# Build the Docker image
docker build -t image-to-sbgn .

# Run the container
docker run -p 4000:4000 \
  -e OPENAI_API_KEY=your_key \
  -e GEMINI_API_KEY=your_key \
  image-to-sbgn
```

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your PR:
- Follows the existing code style
- Includes appropriate documentation
- Has been tested with multiple SBGN diagrams

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2024 Hasan Balcı

## 🙏 Acknowledgments

- **Luna Lab** at [sciluna.com](https://sciluna.com) for project support
- **SBGN Community** for the standardized notation system
- **INDRA** for biological entity grounding services
- Contributors to the open-source libraries used in this project

## 📚 Related Resources

- [SBGN Official Website](https://sbgn.github.io/)
- [SBGN Specifications](https://sbgn.github.io/sbgn/specifications)
- [Cytoscape.js](https://js.cytoscape.org/)
- [Token.js Documentation](https://tokenjs.org/)

## 📧 Contact

For questions or support, please open an issue on GitHub or contact the Luna Lab team.

---

Made with ❤️ by [Luna Lab](https://github.com/sciluna)
