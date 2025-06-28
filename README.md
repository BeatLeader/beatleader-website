# BeatLeader Website

[![Netlify Status](https://api.netlify.com/api/v1/badges/3930b442-ffc4-4039-ac79-446a61ca582b/deploy-status)](https://app.netlify.com/sites/nostalgic-kare-ad710f/deploys)

## Users

Just go to [beatleader.com](https://beatleader.com)

## Community

- [BeatLeader Discord](https://discord.gg/2RG5YVqtG6)

_The BeatLeader is an unofficial community project and not officially
affiliated with Beat Saber._

## Devs

### Install the dependencies

```bash
yarn install
```

### Starting local build

Install netlify-cli(one time setup):

```bash
npm install netlify-cli -g
```

Start Netlify dev environment(every time):

```bash
netlify dev
```

Navigate to [localhost:8888](http://localhost:8888). You should see the app running.
Website will reload automatically after you save your changes.

### Contributing

- Create a fork ("Fork" button on top) or ask me in [Discord](https://discord.gg/2RG5YVqtG6) to add you to this repository as a developer if you plan to contribute often.
- Create work branch ("nsgolova/rankingImprovements" for example). You can push to the master in your fork, but not in the main repository.
- Commit and push your changes.
- Open a pull request. Netlify will deploy a stage website for your fork and you can test it out.
- Your pull request would be merged and changes will deploy to the website!

### Building and running in production mode

By default, Netlify builds the app after every change to the master branch in the repository, so all you need is

```bash
git push
```

### ... but I don't use Netlify

Check your hosting provider's documentation.

Note that the project uses Netlify redirects to bypass CORS issues in the Beat Savior API.

Check the contents of [netlify.toml](netlify.toml) and see how you can resolve this with your provider.
