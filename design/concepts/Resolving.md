# Resolving

## Purpose

Associate external activity references with stable internal items and keep a human-readable description of each item with the concept that owns its identity. This prevents shared interest from being missed when two people encounter the same activity through different links or enter the same activity name independently.

## Principle

A user encounters an activity at a URL and Resolving maps that reference to one stable Item.

Resolving the same normalized URL again returns the same Item.

If a newly encountered reference is described with the same normalized activity name as an existing Item, the new reference is associated with that existing Item instead. Name matching is exact after normalization rather than fuzzy: capitalization, punctuation, apostrophes, and repeated whitespace do not distinguish activities, but meaningfully different names remain different Items.

This gives the MVP a conservative way for different links to converge without attempting broader semantic entity resolution.

## Types

```types
external Reference
  An external reference to an activity.
```

## State

```state
a set of Items with
  a name String
  a normalizedName String
  a reference Reference

a set of Resolutions with
  a unique reference Reference
  an item Item
```

## Actions

```actions
resolve(reference: Reference) : returns (item: Item)
  where a Resolution has reference
  then
    bind item to that Resolution's item
    returns item
  where no Resolution has reference
  then
    add a new Item using reference as its initial name and canonical reference
    add a new Resolution with reference and that Item
    returns item

describe(item: Item, name: String, reference: Reference) : returns (resolved: Item)
  where item is not an existing Item
  then
    refuses ITEM_NOT_FOUND "This item does not exist."
  where item is an existing Item and another Item has the same normalized name
  then
    associate reference with that matching Item
    remove item if it no longer has any associated references
    bind resolved to the matching Item
    returns resolved
  where item is an existing Item and no other Item has the same normalized name
  then
    set the Item's name to name, normalized name to the normalized form of name, and canonical reference to reference
    bind resolved to item
    returns resolved

associate(reference: Reference, item: Item) : returns ()
  where item is an existing Item
  then
    associate reference with item, replacing any prior association for reference
    returns
  where item is not an existing Item
  then
    refuses ITEM_NOT_FOUND "This item does not exist."
```

## Queries

```queries
_item(reference: Reference) : optional (item: Item)
  answers the Item associated with reference
  answers no row when reference has no associated Item

_references(item: Item) : many (reference: Reference)
  answers every Reference associated with item
  answers no rows when item has no associated References

_get(item: Item) : optional (name: String, reference: Reference)
  answers the Item's human-readable name and canonical Reference
  answers no row for an unknown Item
```