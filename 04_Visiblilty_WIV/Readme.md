# Visibility in WIV
Because everything is a single mesh, so we need to use `subset` to hide the ifc element.

subsets are identified by 3 things
- modelID
- material
- custom id (optional)
  
Because the building model is a mesh, the modelIDs are the same.

- removeFromSubset()
- createSubset()

# Single item visibilities

## When invisible -> none selectable

