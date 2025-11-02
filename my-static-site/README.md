# My Static Site

This is a simple static website project designed to be hosted on GitHub Pages. Below are the details and instructions for setting up and using the project.

## Project Structure

```
my-static-site
├── src
│   ├── index.html        # Main HTML file
│   ├── about.html        # About page
│   ├── 404.html          # 404 error page
│   ├── assets
│   │   ├── css
│   │   │   └── styles.css # Stylesheet for the website
│   │   ├── js
│   │   │   └── main.js    # JavaScript file for interactivity
│   │   └── fonts
│   │       └── .gitkeep    # Keeps the fonts directory in Git
├── CNAME                  # Custom domain for GitHub Pages
├── .gitignore             # Files to ignore in Git
├── package.json           # npm configuration file
└── README.md              # Project documentation
```

## Setup Instructions

1. **Clone the Repository**: 
   Clone this repository to your local machine using:
   ```
   git clone https://github.com/yourusername/my-static-site.git
   ```

2. **Navigate to the Project Directory**:
   ```
   cd my-static-site
   ```

3. **Install Dependencies** (if any):
   If you have a `package.json` file with dependencies, run:
   ```
   npm install
   ```

4. **Open the Project**:
   Open `src/index.html` in your web browser to view the website.

## Usage

- The main page is located at `src/index.html`.
- For more information about the website or the creator, visit `src/about.html`.
- If you navigate to a non-existent page, you will be redirected to `src/404.html`.

## Deployment

To deploy the site on GitHub Pages, push your changes to the `main` branch of your repository. If you have a custom domain, ensure that the `CNAME` file is correctly configured.

## License

This project is open-source and available under the [MIT License](LICENSE).