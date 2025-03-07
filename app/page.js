import Image from "next/image";
import PayPalCheckout from "./PayPalCheckout"
export default function Home() {
  return (
    <div className="grid items-center min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <PayPalCheckout />
    </div>
  );
}
