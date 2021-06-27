import React, { FC, useEffect, useState } from 'react';
import { IoIosImages } from '@react-icons/all-files/io/IoIosImages';
import { IoIosImage } from '@react-icons/all-files/io/IoIosImage';
import { BsEyeSlashFill } from '@react-icons/all-files/bs/BsEyeSlashFill';
import { BsEyeFill } from '@react-icons/all-files/bs/BsEyeFill';
import { IoRocketSharp } from '@react-icons/all-files/io5/IoRocketSharp';
import { IoLayers } from '@react-icons/all-files/io5/IoLayers';
import { IoShapes } from '@react-icons/all-files/io5/IoShapes';
import { GoSettings } from '@react-icons/all-files/go/GoSettings';
import { ProgramsPerf, usePerfStore } from '../headless';
import { Texture } from 'three';

import {
  ProgramGeo,
  ProgramHeader,
  ProgramTitle,
  ToggleVisible,
  ProgramConsole,
  ProgramsUL,
  ProgramsULHeader,
  Toggle,
  PerfI,
  PerfB,
} from '../styles';
import { RiArrowDownSFill } from '@react-icons/all-files/ri/RiArrowDownSFill';
import { RiArrowRightSFill } from '@react-icons/all-files/ri/RiArrowRightSFill';
import { PerfProps } from '..';

const addTextureUniforms = (id: string, texture: any) => {
  const repeatType = (wrap: number) => {
    switch (wrap) {
      case 1000:
        return 'RepeatWrapping';
      case 1001:
        return 'ClampToEdgeWrapping';
      case 1002:
        return 'MirroredRepeatWrapping';
      default:
        return 'ClampToEdgeWrapping';
    }
  };

  const encodingType = (encoding: number) => {
    switch (encoding) {
      case 3000:
        return 'LinearEncoding';
      case 3001:
        return 'sRGBEncoding';
      case 3002:
        return 'RGBEEncoding';
      case 3003:
        return 'LogLuvEncoding';
      case 3004:
        return 'RGBM7Encoding';
      case 3005:
        return 'RGBM16Encoding';
      case 3006:
        return 'RGBDEncoding';
      case 3007:
        return 'GammaEncoding';
      default:
        return 'ClampToEdgeWrapping';
    }
  };
  return {
    name: id,
    url: texture.image.currentSrc,
    encoding: encodingType(texture.encoding),
    wrapT: repeatType(texture.image.wrapT),
    flipY: texture.flipY.toString(),
  };
};

const UniformsGL = ({ program, material, setTexNumber }: any) => {
  const gl = usePerfStore((state) => state.gl);
  const [uniforms, set] = useState<any | null>(null);

  useEffect(() => {
    if (gl) {
      const data: any = program?.getUniforms();
      let TexCount = 0;
      const format: any = new Map();

      data.seq.forEach((e: any) => {
        if (
          e.id !== 'isOrthographic' &&
          e.id !== 'uvTransform' &&
          e.id !== 'lightProbe' &&
          e.id !== 'projectionMatrix' &&
          e.id !== 'viewMatrix' &&
          e.id !== 'normalMatrix' &&
          e.id !== 'modelMatrix' &&
          e.id !== 'modelViewMatrix'
        ) {
          let values: any = [];
          let data: any = {
            name: e.id,
          };
          if (e.cache) {
            e.cache.forEach((v: any) => {
              values.push(v.toString().substring(0, 4));
            });
            data.value = values.join();
            if (material[e.id] && material[e.id].image) {
              if (material[e.id].image) {
                TexCount++;
                data.value = addTextureUniforms(e.id, material[e.id]);
              }
            }
            format.set(e.id, data);
          }
        }
      });

      if (material.uniforms) {
        Object.keys(material.uniforms).forEach((key: any) => {
          const uniform = material.uniforms[key];
          if (uniform.value) {
            const { value } = uniform;
            let data: any = {
              name: key,
            };

            if (value instanceof Texture) {
              TexCount++;
              data.value = addTextureUniforms(key, value);
            } else {
              let sb = JSON.stringify(value);
              try {
                sb = JSON.stringify(value);
              } catch (_err) {
                sb = value.toString();
              }
              data.value = sb;
            }
            format.set(key, data);
          }
        });
      }

      if (TexCount > 0) {
        setTexNumber(TexCount);
      }
      set(format);
    }
  }, []);

  return (
    <ProgramsUL>
      {uniforms &&
        Array.from(uniforms.values()).map((uniform: any) => {
          return (
            <span key={uniform.name}>
              {typeof uniform.value === 'string' ? (
                <li>
                  <span>
                    {uniform.name} :{' '}
                    <b>
                      {uniform.value.substring(0, 30)}
                      {uniform.value.length > 30 ? '...' : ''}
                    </b>
                  </span>
                </li>
              ) : (
                <>
                  <li>
                    <b>{uniform.value.name}:</b>
                  </li>
                  <div>
                    {Object.keys(uniform.value).map((key) => {
                      return key !== 'name' ? (
                        <div key={key}>
                          {key === 'url' ? (
                            <a href={uniform.value[key]} target="_blank">
                              <img src={uniform.value[key]} />
                            </a>
                          ) : (
                            <li>
                              {key}: <b>{uniform.value[key]}</b>
                            </li>
                          )}
                        </div>
                      ) : null;
                    })}
                    <ProgramConsole
                      onClick={() => {
                        console.info(
                          material[uniform.value.name] ||
                            material?.uniforms[uniform.value.name]?.value
                        );
                      }}
                    >
                      console.info({uniform.value.name});
                    </ProgramConsole>
                  </div>
                </>
              )}
            </span>
          );
        })}
    </ProgramsUL>
  );
};
type ProgramUIProps = {
  el: ProgramsPerf;
};
const ProgramUI: FC<ProgramUIProps> = ({ el }) => {
  const [showProgram, setShowProgram] = useState(el.visible);

  const [toggleProgram, set] = useState(el.expand);
  const [texNumber, setTexNumber] = useState(0);
  const { meshes, program, material }: any = el;
  return (
    <ProgramGeo>
      <ProgramHeader
        onClick={() => {
          el.expand = !toggleProgram;

          Object.keys(meshes).forEach((key) => {
            const mesh = meshes[key];
            mesh.material.wireframe = false;
          });

          set(!toggleProgram);
        }}
      >
        <Toggle style={{ marginRight: '6px' }}>
          {toggleProgram ? (
            <span>
              <RiArrowDownSFill />
            </span>
          ) : (
            <span>
              <RiArrowRightSFill />
            </span>
          )}
        </Toggle>
        {program && (
          <span>
            <ProgramTitle>{program.name}</ProgramTitle>

            <PerfI style={{ height: 'auto', width: 'auto', margin: '0 4px' }}>
              <IoLayers style={{ top: '-1px' }} />
              {Object.keys(meshes).length}
              <small>{Object.keys(meshes).length > 1 ? 'users' : 'user'}</small>
            </PerfI>
            {texNumber > 0 && (
              <PerfI style={{ height: 'auto', width: 'auto', margin: '0 4px' }}>
                {texNumber > 1 ? (
                  <IoIosImages style={{ top: '-1px' }} />
                ) : (
                  <IoIosImage style={{ top: '-1px' }} />
                )}
                {texNumber}
                <small>tex</small>
              </PerfI>
            )}

            {material.glslVersion === '300 es' && (
              <PerfI style={{ height: 'auto', width: 'auto', margin: '0 4px' }}>
                <IoRocketSharp style={{ top: '-1px' }} />
                300
                <small>es</small>
                <PerfB style={{ bottom: '-9px' }}>glsl</PerfB>
              </PerfI>
            )}
          </span>
        )}
        <ToggleVisible
          onPointerEnter={() => {
            Object.keys(meshes).forEach((key) => {
              const mesh = meshes[key];
              mesh.material.wireframe = true;
            });
          }}
          onPointerLeave={() => {
            Object.keys(meshes).forEach((key) => {
              const mesh = meshes[key];
              mesh.material.wireframe = false;
            });
          }}
          onClick={(e: any) => {
            e.stopPropagation();
            Object.keys(meshes).forEach((key) => {
              const mesh = meshes[key];
              const invert = !showProgram;
              mesh.visible = invert;
              el.visible = invert;
              setShowProgram(invert);
            });
          }}
        >
          {showProgram ? <BsEyeFill /> : <BsEyeSlashFill />}
        </ToggleVisible>
      </ProgramHeader>
      <div
        style={{ maxHeight: toggleProgram ? '9999px' : 0, overflow: 'hidden' }}
      >
        <ProgramsULHeader>
          <GoSettings /> Uniforms:
        </ProgramsULHeader>
        <UniformsGL
          program={program}
          material={material}
          setTexNumber={setTexNumber}
        />
        <ProgramsULHeader>
          <IoShapes /> Geometries:
        </ProgramsULHeader>

        <ProgramsUL>
          {meshes &&
            Object.keys(meshes).map(
              (key) =>
                meshes[key] &&
                meshes[key].geometry && (
                  <li key={key}>{meshes[key].geometry.type}</li>
                )
            )}
        </ProgramsUL>
        <ProgramConsole
          onClick={() => {
            console.info(material);
          }}
        >
          console.info({material.type})
        </ProgramConsole>
      </div>
    </ProgramGeo>
  );
};

export const ProgramsUI: FC<PerfProps> = () => {
  usePerfStore((state) => state.triggerProgramsUpdate);
  const programs = usePerfStore((state) => state.programs);
  return (
    <>
      {programs &&
        Array.from(programs.values()).map((el: ProgramsPerf) => {
          if (!el) {
            return null;
          }
          return el ? <ProgramUI key={el.material.uuid} el={el} /> : null;
        })}
    </>
  );
};