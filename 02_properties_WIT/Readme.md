# IFC 
There're a lot of self reference in ifc files.

## Properties in IFC
- Type properties
- Quantity sets: `dimensions` -> measure
- Native properties: `JSON` format
- Property sets: `user defined` properties
- Material properties

## How to get Infomation from ifc.js
- getItemProperties()
- getTypeProperties()
- getMaterialProperties()

- getAllItemsOfType()

## How to traverse in IFC model
> you can basically traverse the whole IFC navigating through references(**Express ID**).

- `getItemProperties()` to traverse
- spatial structure to traverse
  
