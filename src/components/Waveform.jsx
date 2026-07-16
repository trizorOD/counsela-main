function Waveform({ progress, values }) {
    const activeBars = Math.round(values.length * progress);

    return (
        <span className="waveform" aria-hidden="true">
            {values.map((value, index) => (
                <span
                    className={`waveform__bar ${index < activeBars ? "is-active" : ""}`}
                    key={index}
                    style={{ height: `${Math.round(value * 100)}%` }}
                ></span>
            ))}
        </span>
    );
}

export default Waveform;
