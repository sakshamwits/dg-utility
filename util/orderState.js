// statusConstants.js

export const excludeBufferState = [
  "Pending",
  "Packed",
  "Agent-assigned",
  "Out-for-pickup",
  "Pickup-failed",
];

export const includeBufferState = [
  "Order-picked-up",
  "In-transit",
  "At-destination-hub",
  "Out-for-delivery",
  "Delivery-failed",
];

export const notCancellableState = ["Order-delivered", "Cancelled"];
