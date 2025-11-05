import Hero from "@/components/Hero";
import SearchFilter from "@/components/SearchFilter";

export default function HomePage() {
  return (
    <main>
      <Hero />

      {/* Search + Filter + List */}
      <SearchFilter />
    </main>
  );
}
