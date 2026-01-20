'use client';

import { Sparkles, Loader2 } from 'lucide-react';
import AdBanner from './AdBanner';
import styles from './ProcessingModal.module.css';

export default function ProcessingModal({ isOpen, message = "AI가 고성능 분석을 진행 중입니다..." }) {
    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <Sparkles className={styles.icon} size={24} />
                    <h3>AI 분석 중</h3>
                </div>

                <div className={styles.body}>
                    <div className={styles.loaderWrapper}>
                        <Loader2 className={styles.spinner} size={40} />
                    </div>
                    <p className={styles.message}>{message}</p>
                    <p className={styles.subMessage}>최상의 퀄리티를 위해 약 10~20초 정도 소요될 수 있습니다.</p>
                </div>

                {/* Monetization during wait time */}
                <div className={styles.adSection}>
                    <div className={styles.adLabel}>잠시만 기다려주세요</div>
                    <AdBanner slot="3106703198" format="rectangle" responsive="false" style={{ display: 'inline-block', width: '300px', height: '250px' }} />
                </div>
            </div>
        </div>
    );
}
