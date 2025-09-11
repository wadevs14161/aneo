export default function AboutPage() {
  return (
    <div style={{
      padding: '40px 20px',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: 'bold',
          marginBottom: '30px',
          color: '#333',
          textAlign: 'center'
        }}>
          About Aneo
        </h1>
        
        <div style={{
          fontSize: '16px',
          lineHeight: '1.6',
          color: '#555'
        }}>
          <p style={{ marginBottom: '20px' }}>
            Welcome to Aneo, your premier destination for online learning and skill development. 
            We believe that education should be accessible, engaging, and transformative for everyone.
          </p>
          
          <p style={{ marginBottom: '20px' }}>
            Our platform offers a diverse range of courses spanning from sports and fitness 
            to lifestyle and entertainment skills. Whether you're looking to master tennis techniques, 
            learn karaoke fundamentals, or train your beloved pet, we have expert instructors 
            ready to guide you on your learning journey.
          </p>
          
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            marginTop: '30px',
            marginBottom: '15px',
            color: '#333'
          }}>
            Our Mission
          </h2>
          
          <p style={{ marginBottom: '20px' }}>
            To democratize learning by providing high-quality, affordable, and accessible 
            online courses that empower individuals to pursue their passions and develop 
            new skills at their own pace.
          </p>
          
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            marginTop: '30px',
            marginBottom: '15px',
            color: '#333'
          }}>
            Why Choose Aneo?
          </h2>
          
          <ul style={{ marginBottom: '20px', paddingLeft: '20px' }}>
            <li style={{ marginBottom: '10px' }}>Expert instructors with real-world experience</li>
            <li style={{ marginBottom: '10px' }}>High-quality video content and materials</li>
            <li style={{ marginBottom: '10px' }}>Learn at your own pace, anytime, anywhere</li>
            <li style={{ marginBottom: '10px' }}>Affordable pricing with lifetime access</li>
            <li style={{ marginBottom: '10px' }}>Comprehensive course categories</li>
          </ul>
          
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            marginTop: '30px',
            marginBottom: '15px',
            color: '#333'
          }}>
            Contact Us
          </h2>
          
          <p style={{ marginBottom: '10px' }}>
            Have questions or need support? We're here to help!
          </p>
          
          <p style={{ marginBottom: '5px' }}>
            <strong>Email:</strong> support@aneo.com
          </p>
          <p style={{ marginBottom: '5px' }}>
            <strong>Phone:</strong> +1 (555) 123-4567
          </p>
          <p>
            <strong>Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM EST
          </p>
        </div>
      </div>
    </div>
  );
}