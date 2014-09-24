precision mediump float;

varying vec3 fposition;
varying vec3 fnormal;

varying vec2 ftexcoords;

struct Material
{
  vec3 mKAmbient;
  vec3 mKDiff;
  vec3 mKSpec;
  float mShininess;
};

struct Light
{
  vec3 mI0;
  vec3 mPosition;
  float mQuadraticAttenuation;
};

uniform Material material;
uniform Light light1;
uniform Light light2;
uniform vec3 viewPosition;
uniform vec3 ambientLight;

uniform sampler2D uSampler;

vec3 calculateDiffuseLighting(Material mat, Light light, 
                              vec3 lightDirection, vec3 normal, float attenuation)
{
  vec3 IDiff = light.mI0 * mat.mKDiff * clamp(dot(normal, lightDirection), 0.0,1.0) / attenuation;
  return IDiff; 
}

vec3 calculateSpecularLighting(Material mat, Light light, 
                               vec3 normal, vec3 lightDirection, vec3 viewDirection, float attenuation)
{
  vec3 ISpec = light.mI0 * mat.mKSpec * pow(clamp(dot(reflect(-lightDirection, normal), viewDirection),0.0,1.0), mat.mShininess) / attenuation; 



  return ISpec;
}

void main()
{
  vec3 texcolor = texture2D(uSampler, ftexcoords).xyz; 
  Material mat = material;
  mat.mKDiff = texcolor;

  vec3 lightDirection1 = normalize(light1.mPosition - fposition);
  float distance1 = length(light1.mPosition - fposition);
  float attenuation1 = light1.mQuadraticAttenuation * distance1;
//  float attenuation1 = 1.0; 


  vec3 lightDirection2 = normalize(light2.mPosition - fposition);
  float distance2 = length(light2.mPosition - fposition);
  float attenuation2 = light2.mQuadraticAttenuation * distance2;
//  float attenuation2 = 1.0;
  vec3 viewDirection = normalize(viewPosition - fposition);
   

  vec3 IDiff1 = calculateDiffuseLighting(mat, light1, lightDirection1, fnormal, attenuation1);

  vec3  ISpec1 = calculateSpecularLighting(mat, light1, fnormal, lightDirection1, viewDirection, attenuation1); 

  vec3 IDiff2 = calculateDiffuseLighting(mat, light2, lightDirection2, fnormal, attenuation2);

  vec3  ISpec2 = calculateSpecularLighting(mat, light2, fnormal, lightDirection2, viewDirection, attenuation2); 

 
  vec3 IAmbient = ambientLight * material.mKAmbient; 
 

  
  gl_FragColor = vec4(IAmbient + IDiff1 + ISpec1 + IDiff2 + ISpec2,1);
}
