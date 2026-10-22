import { About } from '../components/landing/About';
import { Solutions } from '../components/landing/Solutions';
import { Testimonials } from '../components/landing/Testimonials';
import { Missions } from '../components/landing/Missions';
import { Sectors } from '../components/landing/Sectors';
import { Difference } from '../components/landing/Difference';
import { Partners } from '../components/landing/Partners';
import { useOutletContext } from 'react-router';
import { Hero } from '../components/landing/Hero';
export function LandingPage() {
  const { requestDemo } = useOutletContext<{ requestDemo: (trigger: HTMLElement) => void }>();
  return <>
    <title>Kindsight — Fundraising Intelligence</title>
    <Hero onRequestDemo={requestDemo} />
    <Partners />
    <div className="landing-story">
      <Difference />
      <div className="about-solutions-story">
        <About />
        <div className="solutions-testimonial-story">
          <Solutions />
          <div className="testimonial-scene">
            <Testimonials />
            <div className="testimonial-scene__hold" aria-hidden="true" />
            <Missions><Sectors /></Missions>
          </div>
        </div>
      </div>
    </div>
  </>;
}
