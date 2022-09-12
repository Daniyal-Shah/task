# FloorFound Platform

## Tool Documentation

### Shared

- [Typescript](https://www.typescriptlang.org/)
- [GraphQL Code Generator](https://www.graphql-code-generator.com/)
- [NX](https://nx.dev/)
- [Yarn 2](https://yarnpkg.com/)

### API

- [Apollo Server (Express)](https://www.apollographql.com/docs/apollo-server/integrations/middleware/#apollo-server-express)
- [Express](https://expressjs.com/)
- [jose](https://github.com/panva/jose/)
- [GraphQL Modules](https://www.graphql-modules.com/)
- [Prisma](https://www.prisma.io/docs/)

### UI

- [React](https://reactjs.org/)
- [Next](https://nextjs.org/)
- [Chakra UI](https://chakra-ui.com/) + [Emotion](https://emotion.sh/docs/styled)
- [Apollo Client](https://www.apollographql.com/docs/react/)
- [apollo-link-token-refresh](https://github.com/newsiberian/apollo-link-token-refresh)
- [react-testing-library](https://testing-library.com/docs/react-testing-library/intro/)

## Setup

- install docker
- install yarn globally

  ```bash
  npm install -g yarn
  ```

- install nx globally

  ```bash
  npm install -g nx
  ```

- find and rename all .env.example files to .env (/apps/api, /apps/web,
  /libs/api/prisma/src/lib)

  ```bash
  find ./ -iname '.env.example' -execdir cp {} .env \;
  ```

  If on Windows PowerShell:

  ```bash
  Get-ChildItem -Filter *.env.example -Recurse | % { Copy-Item $_.FullName ($_.FullName -replace '.env.example','.env') }
  ```

- install packages

  ```bash
  yarn
  ```

### NVM

We use [Node Version Manager](https://github.com/nvm-sh/nvm) to allow us to switch Node.js versions easily.
Please setup NVM, and then you can run:

```bash
nvm use
```

in the project's root directory.

## Do work

- install dependencies

  ```bash
  yarn
  ```

- create docker network

  ```bash
  docker network create floorfound-net
  ```

- bring up database in docker

  ```bash
  yarn db:up
  ```

- migrate the database

  ```bash
  yarn prisma:migrate:dev
  ```

- generate the graphql typescript types for the codebase

  ```bash
  yarn codegen
  ```

- seed the database

  ```bash
  yarn prisma:seed
  ```

- optionally, start the Prisma Studio UI as a postgres frontend

  ```bash
  yarn prisma:studio
  ```

- complete user auth through [keycloak](https://github.com/floorfound/keycloak#running-it)

- start the apps

  ```bash
  yarn dev
  ```

- in another terminal, set codegen to watch mode

  ```bash
  yarn codegen:watch
  ```

## Running [PubSub](https://cloud.google.com/pubsub/docs/emulator) Locally

Update gcloud

```bash
gcloud components install pubsub-emulator
gcloud components update
```

Start emulator

```bash
gcloud beta emulators pubsub start --project=floorfound-local
```

Set env variables `PUBSUB_PROJECT_ID` and `PUBSUB_EMULATOR_HOST`

```bash
$(gcloud beta emulators pubsub env-init)
```

Setup topic and subscription (from project root dir)

```bash
node ./tools/scripts/setupPubsubEmulator.js
```

Then run apps like normal

```bash
yarn dev
```

## Testing

### All tests

Runs all test targets for all projects

```bash
nx run-many --all --target=test
```

OR

```bash
yarn test:all
```

### End to End

We can run cypress tests with

```bash
nx run web-e2e:e2e
```

## Deployments

_if you just want to know how, jump to [this section](#tldr---run-triggers)._

Deployments begin with a cloudbuild yaml file. This cloudbuild file is specific to Google Cloud
Platform (GCP), [Notes on CloudBuild Files](#notes-on-cloudbuild-files). These are used by Cloud
Build -> Triggers to step-by-step build and deploy our projects. Generally every build will involve
building or running Docker images, [Notes on Docker Files](#notes-on-docker-files).

[Kubernetes](#kubernetes) and [Cloud Run](#cloud-run) deployments build a docker image in the
couldbuild steps, then that image is used by Kubernetes or Cloud Run as the deployment artifact -
it's what's used to run our applications in the cloud. Kubernetes has an additional cloudbuild step
of running a kubernetes manifest file to update k8s and trigger the deployment, [Notes on K8S
Manifest Files](#notes-on-k8s). In the case of a [Static Web](#static-web)
deployment, a docker image is built, then a container from the built image runs an export to
generate the static files for the static site. These static files are the deployment artifact, and
are pushed to a GCP Bucket for static hosting.

Probably the trickiest part of our deployment process is making sure environment variables are set
correctly. It's useful to think of environment variables in two groups, **Build Time**, and **Run
Time** variables. Build Time variables must be present when building the docker image, and
potentially later for other project build steps. Run Time variables may not be necessary during
build, but must be present in the hosting environment; _static web deployments cannot have run time
environment variables since they're statically hosted.._

### TLDR - Run Triggers

Our environments in GCP are **FloorFound-Dev** & **FloorFound**. Make sure you're contected to /
using FloorFound-Dev for the Dev environment, and FloorFound for the Production environment.

Most of the Dev environment builds trigger automatically when the github _develop_ branch is
updated. Production triggers are manually ran (subject to change).

To see available FloorFound-Dev triggers, login to GCP and go
[here](https://console.cloud.google.com/cloud-build/triggers?project=floorfound-dev) in the
dashboard. To manually run a trigger click the _Run_ button on the far right side of the
screen. Manually running a trigger presents a screen with the option to run against a different
branch, and ability to change the substitution variables injected into the cloudbuild. To view
the build history, go [here](https://console.cloud.google.com/cloud-build/builds?project=floorfound-dev).

### Static Web

Currently the only Static Web project we deploy is **Platform-WEB**. The cloudbuild for this project
is unique in that it has a lot of steps involving google cloud buckets. Static sites are hosted in
storage buckets within GCP. The buckets may be browsed
[here](https://console.cloud.google.com/storage/browser?project=floorfound-dev&prefix=), and the
active bucket is hosted by the Load Balancer in GCP
[here](https://console.cloud.google.com/net-services/loadbalancing/details/http/platform-web-dev?project=floorfound-dev).

The cloud build for platform-web runs asyncronously to be more efficient, more details on that in
[Notes on CloudBuild Files](#notes-on-cloudbuild-files).

The new bucket is created and setup for hosting publicly while the project image is built. From the
image, a container runs and exports the static web files. The static web files get pushed into the
bucket, and older buckets are removed to save space.

#### platform-web

_We have plans to conslidate these cloudbuild files together._

- CloudBuild File: `./cloudbuild-web-dev.yaml` & `./cloudbuild-web-prod.yaml`
- DockerFile: `./Dockerfile.web`
- DEV: [recommerce-dev.floorfound.com](https://recommerce-dev.floorfound.com)
- PROD: [recommerce.floorfound.com](https://recommerce.floorfound.com)

### Kubernetes

Kubernetes deployments build a container image of the project, update an available kubernetes
deployment manifest template using `sed`, then runs the deployment manifest with `kubectl`. The
deployment manifest update tells our GKE kubernetes cluster to spawn new pods for the hosted service
with containers from the new image.

Some kubernetes deployment manifest files include environment variables in them, which will be
available to the running container.

[Notes on K8S](#notes-on-k-8-s)

#### platform-api

_We have plans to conslidate these cloudbuild files together._

- CloudBuild File: `./cloudbuild-api-dev.yaml` & `./cloudbuild-api-prod.yaml`
- DockerFile: `./Dockerfile.api`
- DEV: [recommerce-api-dev.floorfound.com](https://recommerce-api-dev.floorfound.com)
- PROD: [recommerce-api.floorfound.com](https://recommerce-api.floorfound.com)

#### productfile-processor

_We have plans to conslidate these cloudbuild files together._

- CloudBuild File: `./cloudbuild-productfile-processor-dev.yaml` & `./cloudbuild-productfile-processor-prod.yaml`
- DockerFile: `./Dockerfile.productfile_processor`

### Cloud Run

Cloud Run deployments work similar to kubernetes ones in that an image is built to run containers
from. The difference is instead of kubectl, gcloud is used to directly update a Cloud Run Service
with the new image.

Cloud run services may have environment variables set directly within GCP. They may be viewed [here](https://console.cloud.google.com/run?project=floorfound-dev)

[Google Cloud Run Docs](https://cloud.google.com/run/docs)

#### image-processor

_We have plans to conslidate these cloudbuild files together._

- CloudBuild File: `./cloud-run/image-processor/cloudbuild-dev.yaml` & `./cloud-run/image-processor/cloudbuild-prod.yaml`
- DockerFile: `./cloud-run/image-processor/Dockerfile`

#### order-processor

_We have plans to conslidate these cloudbuild files together._

- CloudBuild File: `./cloud-run/order-processor/cloudbuild-dev.yaml` & `./cloud-run/order-processor/cloudbuild-prod.yaml`
- DockerFile: `./cloud-run/order-processor/Dockerfile`

#### webhook-processor

_We have plans to conslidate these cloudbuild files together._

- CloudBuild File: `./cloud-run/webhook-processor/cloudbuild-dev.yaml` & `./cloud-run/webhook-processor/cloudbuild-prod.yaml`
- DockerFile: `./cloud-run/webhook-processor/Dockerfile`

### DataBase

Platform database changes are handled by Prisma in the form of Migrations. The **Platfor-API**
project is responsible for running these migrations via the default command, `CMD`, value in it's
_Dockerfile.api_. When the **Platform-API** container spins up in Kubernetes from the docker image,
this command is run triggering the prisma migration and then running the app.

#### Resources

[Prisma Migrate Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)

## Notes on CloudBuild Files

CloudBuild yaml files in GCP are triggerable deployment configurations. The configuration is a
collection of steps and supports hooking in to other tools within GCP. It's helpful to understand
containerization tech, like Docker, to understand cloudbuild files since every step in a cloudbuild
runs within a container. Most of our cloudbuild steps use images provided by GCP Cloud Build,
but we also have custom images for cloudbuild steps.

Steps include a `name`, `id`, `args`, sometimes an `entrypoint`, and potentially other options.
`name` identifies which container to use, `id` is a cloudbuild identifier presened in the UI and
used by the [Aysncronous Wait For](#asyncronous-steps-wait-for), `args` are values passed to the
step container, like Docker CMD arguments, and `entrypoint` identifies what to pass args to in the
step. Usually if `name` ends with a slash value like `/docker`, `/gcloud`, `/kubectl`, you can
expect that to be the default entrypoint, but if you need to run a different command from the
selected container like `/bin/bash`, `entrypoint` is useful.

### Substitution Variables

CloudBuild files are configurable with Substitution Variables. Some, like `$PROJECT_ID` are provided
natively, and others may be passed in by the trigger, like `$_IMAGE`. All custom subsitution
variables start with an \_underscore\_ after the \$dollar\$ symbol, and may have a default value set
in a `substitutions` section. Secret subtitutions must begin with two \$dollar\$ symbols, require a
`secretEnv` property in the step where they're used, and **must be used within bash**.

More details on secrets [here](#secret-manager-passwords) & official documentation in [Resources](#cloudbuild-resources)

### Asyncronous Steps (Wait For)

Cloud build supports asyncronously running build steps for when deployment steps may be ran
independantly, and don't rely on a syncronous build pipeline. This is done with the `waitFor` property
on steps. If excluded, all steps run synchronously. When present, the value must be an array of step
`id`s that a step depends on, or `-` if the step should begin immediately.

More details from docs in [Resources](#cloudbuild-resources)

### Secret Manager & Passwords

Secrets are stored in the Secrets -> Secret Manager section of GCP
[here](https://console.cloud.google.com/security/secret-manager?project=floorfound-dev) and
available in cloudbuild configurations. This is a great way to keep passwords out of the code
repository, and manage passwords in one location. One thing to note, passwords are versioned within
Secret Manager with a status of Enabled or Disabled. It's important that when a password is updated
in Secret Manager, the version used by the build is also updated.

To use secrets in cloudbuild configurations an `availableSecrets` section must be present with a
`secretManager` section that contains `versionName` and `env` pairs. `versionName` is the path used
to lookup a secret from secret manager, and `env` is the secret environment variable available to
steps throughout the configuration.

To use env values in a step, the step must have a `secretEnv` property, the value being an array of
`env` variables to make available to the step. To reference these `secretEnv` values, the entrypoint
of the step must be `bash` or `bin/bash` and the variable is referenced with two \$dollar\$ signs.
More details in the Secret Manager Docs from the [Resources](#cloudbuild-resources) section.

<h3 id="cloudbuild-resources">Resources</h3>

- [Getting Started with YAML](https://www.cloudbees.com/blog/yaml-tutorial-everything-you-need-get-started)
- [Cloudbuild Docs](https://cloud.google.com/build/docs)
- [Substitution Variables Docs](https://cloud.google.com/build/docs/configuring-builds/substitute-variable-values)
- [Configuring the Order of Steps (Wait For)](https://cloud.google.com/build/docs/configuring-builds/configure-build-step-order)
- [Secrets with Secret Manager Docs](https://cloud.google.com/build/docs/securing-builds/use-secrets)

## Notes on Docker Files

Docker files include instructions to build a container Image. The resulting, built, image includes
the files which will be available to a container ran from the image.

The important concept to understand is a container ran from an image runs in a single process with
everything which was built into the image, available to it. Our Kubernetes and Cloud Run deployments
build projects within the image build step, then the cloud runs a container from that image.

There's a lot to unpack about Docker, the docs linked in [Resources](#docker-resources) are a good reference.

### Environment Variables

The main part to understand with our docker files is how environment variables work. The cloudbuild
step that builds a docker image will use `--build-arg` to pass substitution
variables into the docker image. The dockerfile receives build-arg values with matching `ARG`
instructions, but environment variables are set in a dockerfile with an `ENV` instruction. So to
break it down

- Normally, a couldfile will pass a substitution variable via `--build-arg`.
- The dockerfile will recieve the value in an `ARG` instruction, and may set a default value.
- An `ENV` instruction is set to the value of the `ARG` to set the environment variable within the
  image. This may look like:

```dockerfile
  ARG SOME_ENV_VAR='default value'
  ENV SOME_ENV_VAR=${SOME_ENV_VAR}
```

### Efficient Builds

Docker images are built with layers, with each argument within a dockerfile adding a layer. To make
a docker build efficient it's important to understand layers to best leverage docker caching and to
produce small layers.

CloudBuild must pull a previously used docker image to reference it for caching when building the
next image. That's why in many cloudbuilds, even if the built image isn't used for running
containers in the cloud, the previous image is pulled and latest image is pushed to the our image
registry. Dockerfiles optimized for caching will copy package manager configurations, and then
install packages, before copying the rest of the projct into the image. This is because caching
works from build layers, and after the cache busts the later COPY commands cannot use the cache.
This is also why builds that are usually 10 minutes may be 25 minutes when a package configuration
change is part of the deployment.

Large docker images not only take up a lot of storage space, they also take a long time to transfer
over the network. We've seen `docker pull` commands in cloudbuilds take upwards of 10 minutes when the
image is over 7 gigabytes. To reduce the size of layers, some dockerfile RUN commands may
include a clean or remove command at the end of an install or build. Since images are built in
layers, if these files are removed in a subsequent layer, the overall image size would not be
reduced even though the resulting image would not include them. The Dive program referenced in
[Resources](#docker-resources) is an excellent tool to identify large layers within a docker image.

Split builds are another technique for creating small docker images. Split builds have multiple FROM
commands in a single dockerfile. One image is created for the build, and then a second image will
act as the runner and copy files from the build image. This is excellent for projects that build
quickly, but we haven't figured out how to cache split builds from previous build images in
cloudbuild, so they aren't used in for all projects.

<h3 id="docker-resources">Resources</h3>

- [Docs](https://docs.docker.com/engine/reference/builder/) - Official DockerFile docs
- [Dive](https://github.com/wagoodman/dive) - Excellent tool for optimizing Docker image sizes

## Notes on K8S

_...More to come_

<!--TODO types of manifest objects, Certificates, Ingress, Deployment, Service -->

<!--TODO quick kubectl intro -->

<!--TODO resources -->

<h3 id="kubernetes-resources">Resources</h3>

- [GKE (Google Kubernetes Engine) Docs](https://cloud.google.com/kubernetes-engine/docs)
- [Kubernetes Official Docs](https://kubernetes.io/docs/home/)
- [Kubectl Reference Docs](https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands)
  \- Great Kubectl docs
- [Lens](https://k8slens.dev/) - Excellent tool for visualizing and editing Kubernetes objects
