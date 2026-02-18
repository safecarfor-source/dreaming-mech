interface Props {
  specialties?: string[];
}

export default function SpecialtyTags({ specialties }: Props) {
  if (!specialties || specialties.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {specialties.map((tag) => (
        <span
          key={tag}
          className="px-3.5 py-1.5 bg-[#EDE9FE] text-[#5B3FBF] rounded-full text-sm md:text-base font-semibold"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
