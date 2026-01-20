'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Triangle, Mail, Lock, Github, Loader2 } from 'lucide-react';
import styles from '../signup/signup.module.css';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (error) throw error;

            // Optional: Show actual login success message
            // alert('로그인에 성공했습니다!');
            router.push('/');
            router.refresh();
        } catch (error) {
            alert(error.message || '로그인 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.signupCard}>
                <div className={styles.header}>
                    <div className={styles.logo}>
                        <Triangle size={24} fill="white" />
                    </div>
                    <h1 className={styles.title}>다시 오신 것을 환영합니다</h1>
                    <p className={styles.subtitle}>TRIANGLE 계정으로 로그인하세요.</p>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>이메일</label>
                        <div className={styles.inputWrapper}>
                            <Mail size={18} className={styles.inputIcon} />
                            <input
                                type="email"
                                name="email"
                                className={styles.input}
                                placeholder="example@triangle.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>비밀번호</label>
                        <div className={styles.inputWrapper}>
                            <Lock size={18} className={styles.inputIcon} />
                            <input
                                type="password"
                                name="password"
                                className={styles.input}
                                placeholder="비밀번호 입력"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className={styles.submitButton} disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : '로그인'}
                    </button>
                </form>

                <div className={styles.divider}>
                    <div className={styles.dividerLine} />
                    <span>Or continue with</span>
                    <div className={styles.dividerLine} />
                </div>

                <div className={styles.socialButtons}>
                    <button className={styles.socialButton}>
                        <Github size={20} />
                        GitHub
                    </button>
                    <button className={styles.socialButton}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.908 3.152-1.928 4.176-1.268 1.268-3.224 2.632-6.912 2.632-5.464 0-9.848-4.412-9.848-9.848s4.384-9.848 9.848-9.848c2.972 0 5.184 1.176 6.736 2.652l2.304-2.304C18.28 1.164 15.54 0 12.48 0 5.58 0 0 5.58 0 12.48s5.58 12.48 12.48 12.48c3.708 0 6.516-1.212 8.72-3.528 2.272-2.272 2.948-5.456 2.948-8.084 0-.78-.06-1.536-.188-2.256h-11.48z" />
                        </svg>
                        Google
                    </button>
                </div>

                <p className={styles.footer}>
                    계정이 없으신가요?
                    <Link href="/signup" className={styles.link}>무료 가입</Link>
                </p>
            </div>
        </div>
    );
}
