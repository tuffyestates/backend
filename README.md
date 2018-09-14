# Backend for Tuffy Estates

*Only make changes to develop branch, master is stable*

Master is a protected branch, you can only merge into it.

## Live Builds (Demos)
[Stable](http://tuffyestates.sparling.us:11638)
[Nightly](http://tuffyestates.sparling.us:11637)

## Wiki
https://gitlab.com/tuffyestates/backend/wikis/home

## Developing
Ensure you have a MongoDB database running and accepted connections on `localhost:27017`.

```
git clone git@gitlab.com:tuffyestates/backend.git -b develop
cd develop
npm install
npm run dev
```
You will now be able to access the server on [localhost:11638](http://localhost:11638).

See https://gitlab.com/tuffyestates/backend/wikis/Development for more information on working on the live environments.

### Launching develop environment
```
git push
```

Once the push is complete a pipeline will start and update the [develop environment](https://gitlab.com/tuffyestates/backend/environments/370949).

## Merging changes into master

File a [new merge request](https://gitlab.com/tuffyestates/backend/merge_requests/new) from the `develop` branch into the `master` branch. Once the branch is merged a [CI pipeline](https://gitlab.com/tuffyestates/backend/pipelines) will be started. Once it completes the deployment stage the server will be accessable with the latest build at [tuffyestates.sparling.us:11638](http://tuffyestates.sparling.us:11638). You can check the status of the environment at [environments](https://gitlab.com/tuffyestates/backend/environments).
