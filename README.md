# ScoreSaber Reloaded

[![Netlify Status](https://api.netlify.com/api/v1/badges/3930b442-ffc4-4039-ac79-446a61ca582b/deploy-status)](https://app.netlify.com/sites/nostalgic-kare-ad710f/deploys)

## Users

Just go to [beatleader.xyz](https://beatleader.xyz)


## Devs

### Install the dependencies

```bash
yarn install
```

### Configure Netlify account 

Create a new Netlify project and link it to the forked repo. 

#### Install netlify dev CLI

```bash
npm install netlify-cli -g
```

Then start Netlify dev environment

```bash
netlify dev
```

Navigate to [localhost:8888](http://localhost:8888). You should see app running.

### Building and running in production mode

By default, Netlify builds the app after every change to the master branch in the repository, so all you need is

```bash
git push
```
### ... but I don't use Netlify

Check your hosting provider's documentation.

Note that the project uses Netlify redirects to bypass CORS issues in the Beat Savior API and to fetch some of the ScoreSaber subpages (not all data is available in the SS API yet).

Check the contents of [netlify.toml](netlify.toml) and see how you can resolve this with your provider.