function main()
{
  // get contex
  var canvas = document.getElementById("viewport");
  var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  if(gl == null)
  {
    throw "cannot get gl context";
  }
  gl.viewport(0,0,canvas.width, canvas.height); 
  // create engine
  var engine = new Engine(gl);
  engine.renderScene();

  // create shader
  var vertexShaderSource = loadTextFile("shader.vert");
  var fragShaderSource = loadTextFile("shader.frag");  
  var shader = new ShaderProgram(gl, vertexShaderSource, fragShaderSource);
  shader.compile();
  shader.makeActive();  

  // load model into scene
  // prob could make a function for this?
  var model = JSON.parse(loadTextFile("./Crytek/models/model.json"));
  var modelRootNode = new Node();
  var model_vbos = [];
  var textures = {};

  console.log(model);

  for(var i = 0; i < model.meshes.length; i++)
  {
    var vbo = new VertexBufferObject(shader);
    vbo.addAttributeArray("position", model.meshes[i].vertexPositions, 3);
    vbo.addAttributeArray("normal", model.meshes[i].vertexNormals, 3);
    vbo.addAttributeArray("texcoords", model.meshes[i].vertexTexCoordinates[0], 2);
    vbo.setIndices(model.meshes[i].indices);
    model_vbos.push(vbo);
 
    var material = model.materials[model.meshes[i].materialIndex];   var subnode = new Node();

    var kdiff = new UniformVariable(shader, "material.mKDiff");
    kdiff.setValue(vec3.clone(material.diffuseReflectance));
    var kspec = new UniformVariable(shader, "material.mKSpec");
    console.log(material.specularReflectance);
    //kspec.setValue(vec3.clone(material.specularReflectance));
    kspec.setValue([1,1,1]);
    var kambient = new UniformVariable(shader, "material.mKAmbient");
    kambient.setValue(vec3.clone(material.ambientReflectance));
    var kshininess = new UniformVariable(shader, "material.mShininess");
    kshininess.setValue([material.shininess]);
    
    if(material.diffuseTexture[0] != "")
    {
      var name = "./Crytek/models/" + material.diffuseTexture[0]; 
      if(textures[name] == null)
      {

        var tex = new Texture(shader, "uSampler", name);
        subnode.addAsset(tex);
        textures[name] = tex;
      } 
      else
      {
        subnode.addAsset(textures[name]);
      }
     
      
       
     
    }
  
    subnode.addAsset(kdiff);
    subnode.addAsset(kspec);
    subnode.addAsset(kambient);
    subnode.addAsset(kshininess);
    subnode.addDrawInterface(new DrawVertexBufferObject(vbo, "modelMat", "normalMat"));
    modelRootNode.addChild(subnode);
  } 
  //modelRootNode.scale([0.1,0.1,0.1]);
  engine.addNode(modelRootNode); 

  
  // projection matrix
  var projection_matrix = mat4.create();
  mat4.identity(projection_matrix, projection_matrix);
  mat4.perspective(projection_matrix, Math.PI/3, canvas.width / canvas.height, .1, 10000);

  // set global shader properties
  shader.setUniform("projMat", projection_matrix); 
  shader.setUniform("light1.mI0", [1,1,1]);
  shader.setUniform("light1.mPosition", [-1000,1000,300]);
  shader.setUniform("light1.mQuadraticAttenuation", [0.01]);
  shader.setUniform("light2.mI0", [1,1,1]);
  shader.setUniform("light2.mPosition", [1000,700, 0]);
  shader.setUniform("light2.mQuadraticAttenuation", [0.01]);
  shader.setUniform("ambientLight", [0,0,0]);


  /// BEWARE EVERYTHING BELOW HERE IS A HACK
  /// NEEDS BE REVISITED IN THE FUTURE


  // create camera and make it orbit scene.(will have a better way to do this some day...
  var camera = new Camera(); 
  // starting pos
  camera.setPosition([0,1000,0]);
  var mouseLoc = [0,0,0,0];
  var keyspressed = {};
  keyspressed['q'] = 0;
  keyspressed['e'] = 0;
  keyspressed['w'] = 0;
  keyspressed['s'] = 0;


  // need a way to do this in engine loop
  // some kind of callback not sure yet
  setInterval(function()
  {

    var normalizedMouseLoc = vec4.create();
    vec4.normalize(normalizedMouseLoc, mouseLoc); 

    var matrix = mat4.create();
    mat4.invert(matrix, camera.getMatrix());
    vec4.transformMat4(normalizedMouseLoc, normalizedMouseLoc, matrix);

    var axis = vec3.create();
    vec3.cross(axis, normalizedMouseLoc, camera.getForwardVector());

    vec3.normalize(axis,axis);

    var test = camera.getForwardVector();
   
    var length = vec3.length(mouseLoc);

    if(length > 100)
    {
      camera.rotate(length / 10000, axis);

    }
    if(keyspressed['e'] == 1)
    {
      camera.rotate(.05, camera.getForwardVector());
    }
    if(keyspressed['q'] == 1)
    {
      camera.rotate(-.05, camera.getForwardVector());
    }
    if(keyspressed['w'] == 1)
    {
      var vec = vec3.create();
      vec3.scale(vec, camera.getForwardVector(), -4);
      camera.translate(vec);
    }
    if(keyspressed['s'] == 1)
    {
      var vec = vec3.create();
      vec3.scale(vec, camera.getForwardVector(), 4);
      camera.translate(camera.getForwardVector());
    }

    shader.setUniform("viewMat", camera.getMatrix());
    shader.setUniform("viewPosition", camera.getPosition());  
  }, 10);

  // user input
  canvas.onmousemove = function(mouseEvent)
  {
    mouseLoc[0] = mouseEvent.x - canvas.width / 2;
    mouseLoc[1] = canvas.height / 2 - mouseEvent.y;  
  }
  
  window.onkeyup = function(key)
  {
    if(key.keyCode == 81)
    {
      keyspressed['q'] = 0;
    }
    if(key.keyCode == 69)
    {
      keyspressed['e'] = 0;
    }
    if(key.keyCode == 87)
    {
      keyspressed['w'] = 0;
    }
    if(key.keyCode == 83)
    {
      keyspressed['s'] = 0;
    }
  }
  window.onkeydown = function(key)
  {
    if(key.keyCode == 81)
    {
      keyspressed['q'] = 1;
    }
    if(key.keyCode == 69)
    {
      keyspressed['e'] = 1;
    }
    if(key.keyCode == 87)
    {
      keyspressed['w'] = 1;
    }
    if(key.keyCode == 83)
    {
      keyspressed['s'] = 1;
    }   


  }
}
