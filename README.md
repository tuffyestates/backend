# Backend for Tuffy Estates

*Only make changes to develop branch, master is stable*

Master is a protected branch, you can only merge into it.

## Developing

```
git clone git@github.com:tuffyestates/backend.git -b develop
cd develop
npm start
```
You will now be able to access the server on [localhost:11638](http://localhost:11638).

See https://gitlab.com/tuffyestates/backend/wikis/Development for more information on working on the live environments.

## Launching staging environment
```
git push
```
Then file a [new merge request](https://gitlab.com/tuffyestates/backend/merge_requests/new) from the `develop` branch into the `master` branch. Once the branch is merged a [CI pipeline](https://gitlab.com/tuffyestates/backend/pipelines) will be started. Once it completes the deployment stage the server will be accessable with the latest build at [direct.sparling.us:11638](http://direct.sparling.us:11638). You can check the status of the environment at [environments](https://gitlab.com/tuffyestates/backend/environments).
