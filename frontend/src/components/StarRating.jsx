/**
 * StarRating — Hiển thị rating bằng Bootstrap Icons (bi-star, bi-star-half, bi-star-fill)
 */
const StarRating = ({ rating = 0, size = 14, interactive = false, onChange }) => {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div style={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      {stars.map((star) => {
        const filled = rating >= star;
        const half   = !filled && rating >= star - 0.5;

        let iconClass = 'bi-star';
        if (filled) iconClass = 'bi-star-fill';
        else if (half) iconClass = 'bi-star-half';

        return (
          <i
            key={star}
            className={`bi ${iconClass}`}
            style={{
              fontSize:   size,
              color:      '#C9956A',
              cursor:     interactive ? 'pointer' : 'default',
              flexShrink: 0,
              lineHeight: 1,
            }}
            onClick={() => interactive && onChange && onChange(star)}
          />
        );
      })}
    </div>
  );
};

export default StarRating;
