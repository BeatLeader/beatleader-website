# BeatLeader App

## Users

Just go to [Releases](/releases)

## Community

- [BeatLeader Discord](https://discord.gg/2RG5YVqtG6)

*The BeatLeader is an unofficial community project and not officially
affiliated with Beat Saber or ScoreSaber.*

## Devs

### Install the dependencies

```bash
yarn install
```

### Starting local build

Start Electron dev environment(every time):
```bash
yarn electron-dev
```

You should see the app running.
Website will reload automatically after you save your changes.

### Contributing

- Create a fork ("Fork" button on top) or ask me in [Discord](https://discord.gg/2RG5YVqtG6) to add you to this repository as a developer if you plan to contribute often.
- Create work branch ("nsgolova/rankingImprovements" for example). You can push to the master in your fork, but not in the main repository.
- Commit and push your changes.
- Open a pull request.
- Your pull request would be merged and new build would be created by CI!

### Building and running in production mode

```bash
yarn electron-pack
```

And check the 'dist' folder