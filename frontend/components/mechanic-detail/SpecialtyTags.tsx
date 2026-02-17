interface Props {
  specialties?: string[];
}

export default function SpecialtyTags({ specialties }: Props) {
  if (!specialties || specialties.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {specialties.map((tag) => (
        <span
          key={tag}
          className="px-2.5 py-1 bg-[#EDE9FE] text-[#5B3FBF] rounded-full text-xs font-medium"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
