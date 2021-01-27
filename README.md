# Lolesports Enhancer

## Building from source
Run `make clean_build`

This will install the dependencies and then build the extension.

---

Other make targets include:

- `make static` - This copies the static files like images, css and json files into the build directory.

- `make scripts` - This runs rollup on the Javascript files that need to be bundled.

- `make build` - This runs the **static** and **scripts** targets alongside packaging the resultant files into
a zip file

- `make clean` - This removes the build directory and everything in it.

- `make clean_install` - This uses the command `npm ci` to perform a fresh installation of all the project's
dependencies

Running make without specifying a target will execute the **build** target

---

**_Lolesports Enhancer_ isn’t endorsed by Riot Games and doesn’t reflect the views or opinions of Riot Games
or anyone officially involved in producing or managing League of Legends. League of Legends and Riot Games are
trademarks or registered trademarks of Riot Games, Inc. League of Legends © Riot Games, Inc.**