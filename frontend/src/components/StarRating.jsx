const StarRating = ({ rating = 0, size = 14, interactive = false, onChange }) => {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {stars.map((star) => {
        const filled = rating >= star;
        const half = !filled && rating >= star - 0.5;

        return (
          <svg
            key={star}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={filled ? '#C9956A' : half ? 'url(#half)' : 'none'}
            stroke="#C9956A"
            strokeWidth="1.5"
            strokeLinecap="round"
            style={{ cursor: interactive ? 'pointer' : 'default', flexShrink: 0 }}
            onClick={() => interactive && onChange && onChange(star)}
          >
            {half && (
              <defs>
                <linearGradient id="half">
                  <stop offset="50%" stopColor="#C9956A" />
                  <stop offset="50%" stopColor="transparent" />
                </linearGradient>
              </defs>
            )}
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        );
      })}
    </div>
  );
};

export default StarRating;
