import {EditorialCta, EditorialImage, Reveal} from './editorial';
import {homepageImages} from './homepageImages';

const MEMBERSHIP_STEPS = [
  {title: 'Create your account', copy: 'Submit your information and request.'},
  {title: 'Speak with management', copy: 'Management communicates with you directly.'},
  {
    title: 'Discuss your request',
    copy: 'Your desired experience or arrangement is considered.',
  },
  {
    title: 'Receive your requirements',
    copy: 'Management provides the appropriate membership requirements.',
  },
  {title: 'Complete membership', copy: 'Complete the required membership process.'},
  {title: 'Access', copy: 'Your private management experience becomes available.'},
];

export function MembershipSection() {
  return (
    <section className="border-x border-[#E8E1D7]/30 bg-[#1E1E1E]">
      <div className="mx-auto grid w-full max-w-[1500px] items-stretch gap-0 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative h-[66vw] max-h-[380px] w-full overflow-hidden sm:max-h-[440px] lg:h-auto lg:max-h-none lg:min-h-[82vh]">
          <EditorialImage
            src={homepageImages.session5}
            alt="A black membership card with the gold GA monogram resting on leather"
            position="object-[center_48%]"
          />
          <div
            className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#1E1E1E] to-transparent"
            aria-hidden
          />
        </div>

        <div className="flex min-w-0 flex-col justify-center px-6 py-12 sm:px-10 lg:px-16 lg:py-24">
          <Reveal>
            <span className="block h-px w-10 bg-[#C89B3C]" aria-hidden />
            <h2 className="mt-4 break-words font-sans text-[11px] font-bold uppercase leading-[1.7] tracking-[0.28em] text-[#FCFAF7] sm:text-[12px]">
              Membership is personal
            </h2>

            <p className="mt-4 max-w-[30rem] break-words font-display text-[15px] leading-[1.9] text-[#B5AEA3] lg:text-base">
              Membership is arranged through management after your request has been reviewed.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <ol className="mt-6 max-w-[34rem]">
              {MEMBERSHIP_STEPS.map((item) => (
                <li key={item.title} className="border-t border-white/12 py-4 last:border-b">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#FCFAF7]">
                    {item.title}
                  </p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-[#B5AEA3]">{item.copy}</p>
                </li>
              ))}
            </ol>

            <div className="mt-6">
              <EditorialCta to="/dashboard/membership" tone="dark">
                Discuss membership
              </EditorialCta>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
