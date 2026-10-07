import {EditorialCta, EditorialImage, Reveal} from './editorial';
import {homepageImages} from './homepageImages';

const EXPERIENCE_KINDS = [
  {title: 'PERSONAL', copy: 'Private experiences and special occasions.'},
  {title: 'CONVERSATION', copy: 'Video, voice and written communication.'},
  {title: 'APPEARANCES', copy: 'Selected meetings and in-person opportunities.'},
  {title: 'PROFESSIONAL', copy: 'Business, creative and professional enquiries.'},
];

export function PrivateExperiencesSection() {
  return (
    <section className="border-b border-[#E8E1D7] bg-[#FCFAF7]">
      <div className="mx-auto grid w-full max-w-[1500px] items-stretch gap-0 lg:grid-cols-[1.1fr_1fr]">
        <div className="relative h-[64vw] max-h-[360px] w-full overflow-hidden sm:max-h-[420px] lg:h-auto lg:max-h-none lg:min-h-[86vh]">
          <EditorialImage
            src={homepageImages.session3}
            alt="A handwritten letter and fountain pen on a private writing desk"
            position="object-[center_55%]"
          />
        </div>

        <div className="flex min-w-0 flex-col justify-center px-6 pt-7 pb-16 sm:px-10 lg:px-16 lg:py-24">
          <Reveal>
            <h2 className="break-words font-display text-[26px] font-medium leading-[1.1] text-[#1E1E1E] sm:text-[32px] lg:text-[36px] xl:text-[40px]">
              <span className="block">PRIVATE</span>
              <span className="block">EXPERIENCES.</span>
            </h2>

            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#A67F2C] sm:text-[11px]">
              Curated. Discreet. Exceptional.
            </p>

            <p className="mt-4 max-w-[30rem] text-sm leading-[1.85] text-[#77716A]">
              Experiences are discussed directly with management and considered according to
              availability and the nature of the request.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <ul className="mt-6 max-w-[30rem]">
              {EXPERIENCE_KINDS.map((kind) => (
                <li key={kind.title} className="border-t border-[#E8E1D7] py-4 last:border-b">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#1E1E1E]">
                    {kind.title}
                  </p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-[#77716A]">{kind.copy}</p>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <EditorialCta to="/dashboard/experiences">Explore experiences</EditorialCta>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
