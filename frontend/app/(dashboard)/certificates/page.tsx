'use client';
// app/(dashboard)/certificates/page.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Award, Download, ExternalLink, Loader2, BookOpen } from 'lucide-react';
import { certificatesApi, enrollmentApi } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';

export default function CertificatesPage() {
  const qc = useQueryClient();

  const { data: certsRes, isLoading } = useQuery({
    queryKey: ['my-certificates'],
    queryFn: () => certificatesApi.list(),
  });

  const { data: coursesRes } = useQuery({
    queryKey: ['my-courses'],
    queryFn: () => enrollmentApi.myCourses(),
  });

  const generateCert = useMutation({
    mutationFn: (courseId: number) => certificatesApi.generate(courseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-certificates'] });
      toast.success('Certificate generated! 🎉');
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Not eligible yet'),
  });

  const certs = certsRes?.data ?? [];
  const completedCourses = (coursesRes?.data ?? []).filter((ec) => ec.progress.percentage === 100);
  const certCourseIds = new Set(certs.map((c) => c.course_id));
  const eligible = completedCourses.filter((ec) => !certCourseIds.has(ec.course.id));

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-6">My Certificates</h1>

      {/* Eligible for certificate */}
      {eligible.length > 0 && (
        <div className="mb-8 p-5 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-xl">
          <h3 className="font-semibold text-emerald-800 dark:text-emerald-400 mb-3">
            🎓 Ready to claim! ({eligible.length})
          </h3>
          <div className="space-y-2">
            {eligible.map((ec) => (
              <div key={ec.course.id} className="flex items-center justify-between bg-white dark:bg-emerald-900/30 rounded-lg p-3">
                <p className="text-sm font-medium">{ec.course.title}</p>
                <button
                  onClick={() => generateCert.mutate(ec.course.id)}
                  disabled={generateCert.isPending}
                  className="flex items-center gap-1.5 h-8 px-3 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50">
                  {generateCert.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Award className="w-3 h-3" />}
                  Generate Certificate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certificates grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-muted rounded-xl shimmer" />
          ))}
        </div>
      ) : certs.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {certs.map((cert) => (
            <div key={cert.id}
              className="relative bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950 dark:via-yellow-950 dark:to-orange-950 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-5 overflow-hidden">
              {/* Decorative */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-200/30 dark:bg-amber-800/20 rounded-full -translate-y-6 translate-x-6" />

              <Award className="w-10 h-10 text-amber-500 mb-3 relative" />
              <p className="font-semibold text-sm mb-1 line-clamp-2">{cert.course?.title}</p>
              <p className="text-xs text-muted-foreground mb-4">
                Issued {new Date(cert.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>

              <div className="flex items-center gap-2">
                {cert.pdf_url && (
                  <a href={cert.pdf_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 h-8 px-3 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 transition-colors">
                    <Download className="w-3 h-3" /> PDF
                  </a>
                )}
                <a href={cert.verify_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 h-8 px-3 bg-white dark:bg-amber-900 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-medium hover:bg-amber-50 transition-colors">
                  <ExternalLink className="w-3 h-3" /> Verify
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Award className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-display font-bold text-lg mb-2">No certificates yet</h3>
          <p className="text-muted-foreground text-sm mb-6">Complete a course 100% to earn your certificate.</p>
          <Link href="/courses"
            className="inline-flex items-center gap-2 h-10 px-5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
            <BookOpen className="w-4 h-4" /> Browse Courses
          </Link>
        </div>
      )}
    </div>
  );
}
