import { notCancellableState } from "../util/orderState.js";

export const isCancellable = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return false;
  }

  if (!data.confirmedItems || !Array.isArray(data.confirmedItems)) {
    return false;
  }

  if (data.confirmedItems.length === 0) {
    return false;
  }
  const deliveryFulfillment = data?.fulfillments?.find(
    (fulfillment) => fulfillment?.type === "Delivery"
  );
  if (notCancellableState.includes(deliveryFulfillment?.state?.descriptor?.code)) {
    return false;
  }
  return data.confirmedItems.every((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return false;
    }

    if (
      !item.product ||
      typeof item.product !== "object" ||
      Array.isArray(item.product)
    ) {
      return false;
    }

    return item.product["@ondc/org/cancellable"] === true;
  });
};
