'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Triangle, Mail, Lock, User, ArrowRight, Github, Loader2 } from 'lucide-react';
import styles from './signup.module.css';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        setIsLoading(true);

        try {
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.name,
                    }
                }
            });

            if (error) throw error;

            alert('회원가입 확인 메일이 발송되었습니다. 이메일을 확인해주세요!');
            router.push('/login');
        } catch (error) {
            alert(error.message || '회원가입 중 오류가 발생했습니다.');
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
                    <h1 className={styles.title}>TRIANGLE 시작하기</h1>
                    <p className={styles.subtitle}>단 몇 초 만에 전문가급 카드뉴스를 만드세요.</p>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>이름</label>
                        <div className={styles.inputWrapper}>
                            <User size={18} className={styles.inputIcon} />
                            <input
                                type="text"
                                name="name"
                                className={styles.input}
                                placeholder="홍길동"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

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
                                placeholder="8자 이상 입력"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>비밀번호 확인</label>
                        <div className={styles.inputWrapper}>
                            <Lock size={18} className={styles.inputIcon} />
                            <input
                                type="password"
                                name="confirmPassword"
                                className={styles.input}
                                placeholder="비밀번호 다시 입력"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className={styles.submitButton} disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : '무료로 시작하기'}
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
                    이미 계정이 있으신가요?
                    <Link href="/login" className={styles.link}>로그인</Link>
                </p>
            </div>
        </div>
    );
}
