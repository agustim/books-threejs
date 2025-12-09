import React from 'react';

const Overlay = ({ bookInfo, onClose }) => {
    return (
        <div style={{
            height: '100%',
            backgroundColor: '#ffffff',
            padding: '4rem 3rem',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Close button */}
            <button
                onClick={onClose}
                style={{
                    alignSelf: 'flex-end',
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: '#999',
                    padding: '0.5rem',
                    lineHeight: 1,
                    transition: 'color 0.2s',
                    fontWeight: '300',
                    marginBottom: '2rem'
                }}
                onMouseEnter={(e) => e.target.style.color = '#333'}
                onMouseLeave={(e) => e.target.style.color = '#999'}
            >
                ✕
            </button>

            {/* Content */}
            <div style={{
                maxWidth: '600px',
                margin: '0 auto',
                width: '100%'
            }}>
                <h1 style={{
                    margin: '0 0 0.75rem 0',
                    fontSize: '2.5rem',
                    color: '#1a1a1a',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    lineHeight: '1.2',
                    fontWeight: '600',
                    letterSpacing: '-0.02em'
                }}>
                    {bookInfo.title}
                </h1>

                <p style={{
                    margin: '0 0 3rem 0',
                    fontSize: '1.25rem',
                    color: '#666',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontWeight: '400',
                    letterSpacing: '-0.01em'
                }}>
                    {bookInfo.author}
                </p>

                <div style={{
                    fontSize: '1.125rem',
                    lineHeight: '1.75',
                    color: '#333',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    fontWeight: '400',
                    letterSpacing: '-0.003em'
                }}>
                    {bookInfo.resume}
                </div>
            </div>
        </div>
    );
};

export default Overlay;
