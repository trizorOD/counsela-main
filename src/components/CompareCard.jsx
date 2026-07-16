function CompareCard({ children, text, title, variant }) {
    return (
        <div className={`compare__block compare__block--${variant}`}>
            <div className="compare__header">
                <span className="compare__header-line"></span>
                <span className="compare__header-title">{title}</span>
                <span className="compare__header-line"></span>
            </div>

            <div className="compare__body">{children}</div>

            <div className="compare__footer">
                <div className="compare__text">{text}</div>
            </div>
        </div>
    );
}

export default CompareCard;
