import Image from "next/image";

export default function Home() {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-screen p-8 sm:p-20">
        <div className="space-y-6">
          <iframe
            src="/onepage"
            width="100%"
            height="500px"
            style={{ border: "none" }}
          ></iframe>
        </div>
        <div className="space-y-6">
          <iframe
            src="/paypal"
            width="100%"
            height="500px"
            style={{ border: "none" }}
          ></iframe>
        </div>
        <div className="space-y-6">
          <iframe
            src="/onepage/button"
            width="100%"
            height="500px"
            style={{ border: "none" }}
          ></iframe>
        </div>
        <div className="space-y-6">
          <iframe
            src="/onepage/card"
            width="100%"
            height="500px"
            style={{ border: "none" }}
          ></iframe>
        </div>
      </div>
    </div>
  );
}


