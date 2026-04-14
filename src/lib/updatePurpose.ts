  export const updateItemPurpose = (arr, updatedItem) => {
    return arr.map((item) =>
      item.id === updatedItem.id
        ? { ...item, purpose: updatedItem?.purpose || "" }
        : item,
    );
  };