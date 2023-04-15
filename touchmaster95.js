
/* eslint-disable no-unused-vars */
function getDistance (p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  function getTouchMidpoint (touch1, touch2) {
    return {
      x: (touch1.x + touch2.x) * 0.5,
      y: (touch1.y + touch2.y) * 0.5,
    };
  }
  
  function getTouches (e) {
    if (e.touches) {
      return [...e.touches].map(t => ({
        x: t.clientX,
        y: t.clientY,
      }));
    }
  
    if (e.button !== 0) {
      return [];
    }
  
    return [{
      x: e.clientX,
      y: e.clientY,
    }];
  }
  
  /**
   * Touchmaster95.
   * 
   * Creator @david.
   * Avatar camera dev @klas 
   */
  export default function touchmaster95 (el, {
    useSpring = true,
    minZoom = 0.1,
    maxZoom = 10,
    allowPanWhileZooming = true,
    minX = -Infinity,
    maxX = Infinity,
    minY = -Infinity,
    maxY = Infinity,
  }, onUpdate) {
    const maxMomentum = 10000;
  
    let touchOrigins = [];
  
    const scrollFactor = 0.1;
    
    let friction = {
      x: 15,
      y: 30,
      zoom: 30,
    };
    
    let spring = {
      x: 15,
      y: 5,
      zoom: 20,
    };
    
    let state = {
      x: 0,
      y: 0,
      zoom: maxZoom,
    };
  
    let stateOrigin = {...state};
    let springyState = {...state};
    
    let momentum = null;
  
    function registerTouch (e) {
      // e.stopPropagation();
      // e.preventDefault();
      
      touchOrigins = getTouches(e);
      
      stateOrigin = {...state};
      
      momentum = null;
    }
  
    function onTouchEnd (e) {
      endAction(e);
      
      touchOrigins = getTouches(e);
    }
  
    function capState (state) {
      if (state.zoom < minZoom) {
        state.zoom = minZoom;
      } else if (state.zoom > maxZoom) {
        state.zoom = maxZoom;
      }
  
      if (state.x < minX) {
        state.x = minX;
      } else if (state.x > maxX) {  
        state.x = maxX;
      }
  
      if (state.y < minY) {
        state.y = minY;
      } else if (state.y > maxY) {
        state.y = maxY;
      }
  
      return state;
    }
  
    let lastMomentumTs = 0;
    function endAction (e) {
      e.stopPropagation();
      e.preventDefault();
      
      onTouchMove(e); // Might provide better momentum
      
      touchOrigins = [];
      
      stateOrigin = {...state};
      
      const newMomentum = getMomentum();
      
      if (! newMomentum) { // Prevent duplicate endAction calls to stop momentum
        return;
      }
      
      if (newMomentum && ! momentum) {
        lastMomentumTs = Date.now();
        requestAnimationFrame(handleMomentum);
      }
      momentum = newMomentum;
    }
    
    let stateHistory = [];
    function trackMomemtum (state) {
      stateHistory.push({
        ...state,
        ts: Date.now(),
      });
      if (stateHistory.length > 100) {
        stateHistory.shift();
      }
    }
    
    function getMomentum () {
      const earliestTs = Date.now() - 100;
      stateHistory = stateHistory.filter(s => s.ts > earliestTs);
      
      if (stateHistory.length < 2) {
        stateHistory = [];
        return null;
      }
      const last = stateHistory[stateHistory.length - 1];
      const first = stateHistory[0];
      stateHistory = [];
      
      const dx = last.x - first.x;
      const dy = last.y - first.y;
      const dzoom = last.zoom - first.zoom;
      const dt = (last.ts - first.ts) * 0.001;
      
      const momentum = {
        x: (dx / dt) || 0,
        y: (dy / dt) || 0,
        zoom: (dzoom / dt) || 0,
      };
  
      if (momentum.x < -maxMomentum) {
        momentum.x = -maxMomentum;
      } else if (momentum.x > maxMomentum) {
        momentum.x = maxMomentum;
      }
  
      if (momentum.y < -maxMomentum) {
        momentum.y = -maxMomentum;
      } else if (momentum.y > maxMomentum) {
        momentum.y = maxMomentum;
      }
  
      return momentum;
    }
    
    let lastSpringTs = Date.now();
    function handleSpring () {
      const now = Date.now();
      const delta = Math.min((now - lastSpringTs) * 0.001, 1);
      lastSpringTs = now;
  
      springyState.x += (state.x - springyState.x) * spring.x * delta;
      springyState.y += (state.y - springyState.y) * spring.y * delta;
  
      springyState.zoom += (state.zoom - springyState.zoom) * spring.zoom * delta;
      
      capState(springyState);
      
      requestAnimationFrame(handleSpring);
      onUpdate(springyState);
    }
    
    // @TODO request when needed, stop when spring animation is complete
    if (useSpring) {
      requestAnimationFrame(handleSpring);
    }
    
    
    function handleMomentum () {
      const now = Date.now();
      const delta = (now - lastMomentumTs) * 0.001;
      lastMomentumTs = now;
      
      if (!momentum) {
        return;
      }
      
      state.x += momentum.x * delta;
      state.y += momentum.y * delta;
      state.zoom += momentum.zoom * delta;
      
      momentum.x *= 1 / (1 + Math.max(0, friction.x * delta));
      momentum.y *= 1 / (1 + Math.max(0, friction.y * delta));
      momentum.zoom *= 1 / (1 + Math.max(0, friction.zoom * delta));
      
      let keepUpdating = false;
      if (Math.abs(momentum.x) < 0.1) {
        momentum.x = 0;
      } else keepUpdating = true;
      
      if (Math.abs(momentum.y) < 0.1) {
        momentum.y = 0;
      } else keepUpdating = true;
      
      if (Math.abs(momentum.zoom) < 0.01) {
        momentum.zoom = 0;
      } else keepUpdating = true;
      
      if (! useSpring) {
        onUpdate(state);
      }
      
      if (keepUpdating) {
        requestAnimationFrame(handleMomentum);
      } else {
        momentum = null;
      }
    }
    function onTouchMove (e) {
      if (touchOrigins.length === 0) {
        return; 
      }
      e.stopPropagation();
      e.preventDefault();
      
      const touches = getTouches(e);
      
      // Panning
      if (touches.length === 1 && touchOrigins.length === 1) {
        const dx = touches[0].x - touchOrigins[0].x;
        const dy = touches[0].y - touchOrigins[0].y;
        
        state.x = stateOrigin.x + dx;
        state.y = stateOrigin.y + dy;
        
        capState(state);
        
        if (! useSpring) {
          onUpdate(state);
        }
        trackMomemtum(state);
      }
      
      // Zooming
      if (touches.length === 2 && touchOrigins.length === 2) {
        if (allowPanWhileZooming) {
          const mid1 = getTouchMidpoint(touchOrigins[0], touchOrigins[1]);
          const mid2 = getTouchMidpoint(touches[0], touches[1]);
          
          const dx = mid2.x - mid1.x;
          const dy = mid2.y - mid1.y;
          
          state.x = stateOrigin.x + dx;
          state.y = stateOrigin.y + dy;
        }
        
        const d1 = getDistance(touchOrigins[0], touchOrigins[1]);
        const d2 = getDistance(touches[0], touches[1]);
        
        state.zoom = stateOrigin.zoom * (d2 / d1);
        
        capState(state);
        
        if (! useSpring) {
          onUpdate(state);
        }
        trackMomemtum(state);
      }
    }
  
    function onScroll (e) {
      e.stopPropagation();
      e.preventDefault();
  
      if (e.wheelDelta > 0) {
        state.zoom /= (1 + scrollFactor)
      } else {
        state.zoom *= (1 + scrollFactor);
      }
  
      capState(state);
        
      if (! useSpring) {
        onUpdate(state);
      }
      trackMomemtum(state);
    }
    
    el.addEventListener('mousedown', registerTouch);
    el.addEventListener('touchstart', registerTouch);
    
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchleave', onTouchEnd);
    
    el.addEventListener('mouseup', endAction);
    el.addEventListener('mouseleave', endAction);
    
    el.addEventListener('touchmove', onTouchMove);
    el.addEventListener('mousemove', onTouchMove);
  
    el.addEventListener('wheel', onScroll);
    
    return {
      destroy () {
        el.removeEventListener('mousedown', registerTouch);
        el.removeEventListener('touchstart', registerTouch);
        
        el.removeEventListener('touchend', onTouchEnd);
        el.removeEventListener('touchleave', onTouchEnd);
        
        el.removeEventListener('mouseup', endAction);
        el.removeEventListener('mouseleave', endAction);
        
        el.removeEventListener('touchmove', onTouchMove);
        el.removeEventListener('mousemove', onTouchMove);
  
        el.removeEventListener('wheel', onScroll);
      },
      setState (newState) {
        state = capState({ ...state, ...newState });
        springyState = { ...state };
        if (! useSpring) {
          onUpdate(state);
        }
      },
      getSpringyState () {
        return { ...springyState };
      }
    };
  }
  