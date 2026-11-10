// lib/firestoreOrders.ts
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { Order } from "./OrderContext";

export async function getOrder(orderId: string): Promise<Order | null> {
  try {
    const docRef = doc(db, "orders", orderId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as Order;
    }
    return null;
  } catch (error) {
    console.error("Error fetching order:", error);
    return null;
  }
}