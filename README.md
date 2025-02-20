In order to export your API KEY:
1. Create a .env file
2. Add your API key:
```
REACT_APP_API_KEY='api_key'
```

Some little useful notes code scraps:

```js
const key1 = localStorage.getItem('currentStoryName');
const memory1 = JSON.parse(localStorage.getItem(key1));
console.log(memory1);

const key2 = localStorage.getItem('currentStoryName');
const memory2 = JSON.parse(localStorage.getItem(key2));
console.log(memory2);

const key3 = localStorage.getItem('currentStoryName');
const memory3 = JSON.parse(localStorage.getItem(key3));
console.log(memory3);

//long prompts make things more interesting
//image magick possibly, for marzipan's things

//will clear everything
localStorage.clear();
```


**I think one might have to run npm install before npm start?**

`npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

#### How to deploy this to GH pages
(According to GPT)

1. Build Your React App

You need to generate the static files for your React app. Run this command in your project directory:

npm run build

This will create a build/ directory with all the files you need to deploy.
2. Install gh-pages Package (Optional but Recommended)

You can automate the deployment process with the gh-pages package. Install it using:

npm install gh-pages --save-dev

3. Update package.json

In your package.json, add a homepage property. It should point to your GitHub Pages URL:

"homepage": "https://<username>.github.io/<repository-name>"

Then, add the following scripts:

"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}

4. Deploy Your App

Run the deploy command:

npm run deploy

This will push the contents of your build/ directory to the gh-pages branch of your repository.
5. Enable GitHub Pages

    Go to your GitHub repository.
    Navigate to Settings > Pages.
    Under Source, select the gh-pages branch, and your site will be live in a few minutes!