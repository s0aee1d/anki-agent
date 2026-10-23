export interface Access {
  status: "none" | "pending" | "approved";
  deviceId?: string;
}
