export const updateItemPurpose = (arr: any[], updatedItem: any) => {
  return arr.map((item) =>
    item.id === updatedItem.id
      ? { ...item, purpose: updatedItem?.purpose || "" }
      : item
  )
}
