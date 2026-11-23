import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function DiscoveryCard() {
  return <div className="discovery-card">
    <div className="discovery-top"><Sparkles size={20} /><span>AI DISCOVERY OF THE DAY</span></div>
    <div className="discovery-art">🌍</div>
    <h3>Why does Earth spin?</h3>
    <p>Explore the fascinating movement of our planet with an interactive science lesson.</p>
    <Link href="/explore/solar-system" className="discovery-action">Discover now <ArrowRight size={15} /></Link>
  </div>;
}
