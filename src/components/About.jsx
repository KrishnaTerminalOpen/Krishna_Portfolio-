function About() {
  return (
    <section id="about" className="about-section">

      <div className="container">

        <div className="row align-items-center">

          {/* LEFT SIDE - TEXT */}
          <div className="col-lg-6">

            <p className="section-label">
              ABOUT ME
            </p>

            <h2 className="section-title">
              Driven by Curiosity
              <br />
              <span>Powered by Data.</span>
            </h2>

            <p className="about-text">
              I'm Krishna, a final year B.Tech student with a strong
              interest in Data Science, Machine Learning and real-world
              problem solving. I enjoy exploring data, finding meaningful
              patterns and building solutions that create value.
            </p>

            <p className="about-text">
              I believe in continuous learning, staying curious and using
              technology to solve meaningful problems. My goal is to build
              a career in Data Science and Artificial Intelligence.
            </p>

            <div className="signature">
              Krishna Sahu
            </div>

          </div>


          {/* RIGHT SIDE */}
          <div className="col-lg-6">

            <div className="about-image-wrapper">

              <img
                src="https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=800&q=80"
                alt="About Krishna"
                className="about-image"
              />

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}

export default About;