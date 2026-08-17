# create-empire-compat datapack

Bundled into the pack via [Paxi](https://modrinth.com/mod/paxi) (zipped by
`scripts/bootstrap.sh` into `pack/config/paxi/datapacks/`), so it loads in
every world automatically.

## What lives here

- `data/minecolonies/tags/item/excluded_food.json` — MineColonies' food
  blacklist tag. Currently a no-op extension point: add item ids here to stop
  citizens from eating something (e.g. quest-reward foods).

## Extension points (roadmap)

- Modded-food acceptance for citizens is primarily handled by the
  **MineColonies Compatibility** addon and the **MineColonies/Farmer's
  Delight compat patch** datapack (both pulled in by the bootstrap script).
  Anything they miss can be patched here.
- Recipe gating (e.g. advanced hut blocks requiring Create brass/precision
  mechanisms) belongs in `data/minecolonies/recipe/` overrides — kept out of
  v0 until each recipe id is verified in-game, because a bad override silently
  removes the vanilla recipe.
