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
          className="px-2 py-0.5 bg-brand-50 text-brand-600 rounded-md text-[var(--text-caption)] font-medium"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
